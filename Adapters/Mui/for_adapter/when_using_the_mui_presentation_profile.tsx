// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThemeProvider, createTheme, useTheme, type Theme } from '@mui/material/styles';
import { runConformance, type ConformanceReport } from '@cratis/components.conformance';
import { beforeAll, describe, it } from 'vitest';
import packageJson from '../package.json';
import { muiUiLibrary } from '../src/index.js';

const stablePresentationSlots = [
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
] as const;

const renderSlot = (
    slotId: (typeof stablePresentationSlots)[number],
    props: Readonly<Record<string, unknown>>,
) => {
    const declaration = muiUiLibrary.slots[slotId];
    if (!declaration) throw new Error(`Missing ${slotId} declaration.`);
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    const Component = declaration.render as unknown as ComponentType<
        Record<string, unknown>
    >;
    return renderToStaticMarkup(createElement(Component, props));
};

const Provider = muiUiLibrary.Provider;
if (!Provider) throw new Error('The MUI adapter provider is missing.');

const ThemeProbe = ({ observe }: { observe: (theme: Theme) => void }) => {
    const theme = useTheme();
    observe(theme);
    return <span data-theme-vars={theme.vars ? 'true' : 'false'} />;
};

describe('when using the MUI stable presentation profile', () => {
    let report: ConformanceReport;

    beforeAll(async () => {
        report = await runConformance(muiUiLibrary, {
            metadata: packageJson.cratis,
            document,
        });
    }, 30_000);

    it('should pass the complete declared profile with zero skips', () => {
        const failures = report.checks
            .filter((check) => check.status === 'failed')
            .map(
                (check) =>
                    `${check.id}: ${check.message} ${JSON.stringify(check.evidence ?? {})}`,
            );
        expect(failures).to.deep.equal([]);
        expect(report.passed).to.equal(true);
        expect(report.summary).to.deep.equal({
            total: 100,
            passed: 100,
            failed: 0,
            skipped: 0,
        });
        expect(muiUiLibrary.profileSlots).to.deep.equal(stablePresentationSlots);
    });

    it('should keep static metadata schema and runtime declarations consistent', () => {
        expect(
            report.checks.find((check) => check.id === 'manifest.schema')?.status,
        ).to.equal('passed');
        expect(
            report.checks.find((check) => check.id === 'manifest.runtimeConsistency')
                ?.status,
        ).to.equal('passed');
        expect(Object.keys(packageJson.cratis.modes)).to.deep.equal(
            stablePresentationSlots,
        );
    });

    it('should preserve native refs, forms, reset behavior, and value-first native events', () => {
        for (const slotId of stablePresentationSlots.filter(
            (candidate) => candidate !== 'common.progress',
        )) {
            expect(
                report.checks.find(
                    (check) => check.id === `contract.${slotId}.elementRef`,
                )?.status,
            ).to.equal('passed');
        }
        expect(
            report.checks.find((check) => check.id === 'behavior.common.button')?.evidence
                ?.submitEvents,
        ).to.equal(1);
        for (const slotId of [
            'common.textInput',
            'common.textArea',
            'common.checkbox',
            'common.radio',
            'common.switch',
        ] as const) {
            const evidence = report.checks.find(
                (check) => check.id === `behavior.${slotId}`,
            )?.evidence;
            expect(evidence).to.include({
                callbacks: 1,
                source: 'user',
                nativeEvent: true,
                resetMatches: true,
            });
        }
    });

    it('should render one real MUI identity for every slot', () => {
        const markup = {
            button: renderSlot('common.button', { label: 'Save' }),
            iconButton: renderSlot('common.iconButton', {
                icon: '+',
                'aria-label': 'Add',
            }),
            textInput: renderSlot('common.textInput', { 'aria-label': 'Name' }),
            textArea: renderSlot('common.textArea', { 'aria-label': 'Notes' }),
            checkbox: renderSlot('common.checkbox', {
                label: 'Selected',
                defaultChecked: true,
            }),
            radio: renderSlot('common.radio', {
                name: 'frequency',
                value: 'daily',
                'aria-label': 'Daily',
            }),
            switchControl: renderSlot('common.switch', { 'aria-label': 'Enabled' }),
            progress: renderSlot('common.progress', { value: 42 }),
            surface: renderSlot('common.surface', { as: 'article' }),
        };
        expect(markup.button).to.contain('MuiButton-root');
        expect(markup.iconButton).to.contain('MuiIconButton-root');
        expect(markup.textInput).to.contain('MuiInputBase-root');
        expect(markup.textArea).to.contain('MuiInputBase-root');
        expect(markup.checkbox).to.contain('MuiCheckbox-root');
        expect(markup.checkbox).to.contain('aria-hidden="true"');
        expect(markup.radio).to.contain('MuiRadio-root');
        expect(markup.switchControl).to.contain('MuiSwitch-root');
        expect(markup.switchControl).to.contain('role="switch"');
        expect(markup.progress).to.contain('MuiLinearProgress-root');
        expect(markup.surface).to.contain('MuiPaper-root');
        expect(markup.surface).to.contain('<article');
    });

    it('should preserve deprecated Button mapping and canonical data attributes', () => {
        const markup = renderSlot('common.button', {
            label: 'Legacy action',
            text: true,
            rounded: true,
            severity: 'danger',
        });
        expect(markup).to.contain('data-variant="ghost"');
        expect(markup).to.contain('data-tone="critical"');
        expect(markup).to.contain('data-severity="danger"');
        expect(markup).to.contain('data-shape="pill"');
        expect(markup).not.to.contain(' text=');
        expect(markup).not.to.contain(' rounded=');
    });

    it('should provide CSS variables only when no outer MUI theme exists', () => {
        let defaultSeen: Theme | undefined;
        const defaultMarkup = renderToStaticMarkup(
            <Provider setup={{}}>
                <ThemeProbe observe={(theme) => (defaultSeen = theme)} />
            </Provider>,
        );
        expect(defaultSeen?.vars).not.to.equal(undefined);
        expect(defaultMarkup).to.contain('data-theme-vars="true"');

        const outerTheme = createTheme({ palette: { primary: { main: '#123456' } } });
        let nestedSeen: Theme | undefined;
        renderToStaticMarkup(
            <ThemeProvider theme={outerTheme}>
                <Provider setup={{}}>
                    <ThemeProbe observe={(theme) => (nestedSeen = theme)} />
                </Provider>
            </ThemeProvider>,
        );
        expect(nestedSeen?.palette.primary.main).to.equal('#123456');
        expect(nestedSeen?.vars).not.to.equal(undefined);
    });

    it('should produce deterministic SSR and mismatch-free hydration evidence', () => {
        for (const slotId of stablePresentationSlots) {
            expect(
                report.checks.find((check) => check.id === `ssr.${slotId}`)?.status,
            ).to.equal('passed');
        }
        expect(
            report.checks.find((check) => check.id === 'ssr.hydration')?.status,
        ).to.equal('passed');
    });

    it('should declare only peer-hosted renderer vendors and exclude MUI X', () => {
        expect(packageJson).not.to.have.property('dependencies');
        expect(packageJson.peerDependencies).to.include({
            '@mui/material': '>=9 <10',
            '@emotion/react': '>=11 <12',
            '@emotion/styled': '>=11 <12',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            '@cratis/components': '>=3.0.0 <4',
        });
        const serialized = JSON.stringify(packageJson);
        expect(serialized).not.to.contain('@mui/x-');
    });
});

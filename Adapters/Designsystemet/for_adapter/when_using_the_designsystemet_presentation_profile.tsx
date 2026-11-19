// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { runConformance, type ConformanceReport } from '@cratis/components.conformance';
import { beforeAll, describe, it } from 'vitest';
import packageJson from '../package.json';
import { designsystemetUiLibrary } from '../src/index.js';

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
    const declaration = designsystemetUiLibrary.slots[slotId];
    if (!declaration) throw new Error(`Missing ${slotId} declaration.`);
    // SAFETY: The fixture props below are paired with the corresponding public slot contract.
    const Component = declaration.render as unknown as ComponentType<
        Record<string, unknown>
    >;
    return renderToStaticMarkup(createElement(Component, props));
};

describe('when using the Designsystemet stable presentation profile', () => {
    let report: ConformanceReport;

    beforeAll(async () => {
        report = await runConformance(designsystemetUiLibrary, {
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
        expect(report.summary.failed).to.equal(0);
        expect(report.summary.skipped).to.equal(0);
        expect(report.summary.passed).to.equal(report.summary.total);
        expect(designsystemetUiLibrary.profileSlots).to.deep.equal(stablePresentationSlots);
    });

    it('should keep static metadata schema and runtime declarations consistent', () => {
        expect(
            report.checks.find((check) => check.id === 'manifest.schema')?.status,
        ).to.equal('passed');
        expect(
            report.checks.find((check) => check.id === 'manifest.runtimeConsistency')
                ?.status,
        ).to.equal('passed');
        expect(Object.keys(packageJson.cratis.modes)).to.deep.equal([
            ...stablePresentationSlots,
            'dialogs.dialog',
        ]);
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

    it('should render one real Designsystemet identity for every slot', () => {
        const markup = {
            button: renderSlot('common.button', { label: 'Save' }),
            iconButton: renderSlot('common.iconButton', { icon: '+', 'aria-label': 'Add' }),
            textInput: renderSlot('common.textInput', { 'aria-label': 'Name' }),
            textArea: renderSlot('common.textArea', { 'aria-label': 'Notes' }),
            checkbox: renderSlot('common.checkbox', {
                label: 'Selected',
                defaultChecked: true,
                readOnly: true,
            }),
            radio: renderSlot('common.radio', { name: 'frequency', value: 'daily', label: 'Daily' }),
            switchControl: renderSlot('common.switch', { label: 'Enabled', readOnly: true }),
            progress: renderSlot('common.progress', { value: 42 }),
            indeterminate: renderSlot('common.progress', { mode: 'indeterminate' }),
            surface: renderSlot('common.surface', { as: 'article' }),
        };
        expect(markup.button).to.contain('ds-button');
        expect(markup.iconButton).to.contain('ds-button');
        expect(markup.iconButton).to.contain('data-icon="true"');
        expect(markup.textInput).to.contain('ds-input');
        expect(markup.textArea).to.contain('ds-input');
        expect(markup.checkbox).to.contain('ds-field');
        expect(markup.checkbox).to.contain('type="checkbox"');
        expect(markup.checkbox).to.contain('aria-readonly="true"');
        expect(markup.radio).to.contain('type="radio"');
        expect(markup.radio).not.to.contain('aria-readonly');
        expect(markup.switchControl).to.contain('role="switch"');
        expect(markup.switchControl).to.contain('aria-readonly="true"');
        expect(markup.progress).to.contain('role="progressbar"');
        expect(markup.indeterminate).to.contain('ds-spinner');
        expect(markup.surface).to.contain('ds-card');
        expect(markup.surface).to.contain('<article');
    });

    it('should preserve deprecated Button mapping and canonical data attributes', () => {
        const markup = renderSlot('common.button', {
            label: 'Legacy action',
            text: true,
            rounded: true,
            severity: 'danger',
        });
        expect(markup).to.contain('data-cratis-variant="ghost"');
        expect(markup).to.contain('data-variant="tertiary"');
        expect(markup).to.contain('data-color="danger"');
        expect(markup).to.contain('data-tone="critical"');
        expect(markup).to.contain('data-severity="danger"');
        expect(markup).to.contain('data-shape="pill"');
        expect(markup).not.to.contain(' text=');
        expect(markup).not.to.contain(' rounded=');
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

    it('should declare only peer-hosted renderer vendors', () => {
        expect(packageJson).not.to.have.property('dependencies');
        expect(packageJson.peerDependencies).to.include({
            '@digdir/designsystemet-react': '>=1.24 <2',
            '@digdir/designsystemet-css': '>=1.24 <2',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            '@cratis/components': '>=4 <5',
        });
    });
});

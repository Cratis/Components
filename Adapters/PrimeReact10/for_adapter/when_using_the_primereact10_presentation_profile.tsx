// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, useContext, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrimeReactContext, PrimeReactProvider } from 'primereact/api/api.cjs.js';
import { CratisComponentsProvider } from '@cratis/components';
import { Button } from '@cratis/components/Common';
import { runConformance, type ConformanceReport } from '@cratis/components.conformance';
import { beforeAll, describe, it } from 'vitest';
import packageJson from '../package.json';
import { primeReact10UiLibrary } from '../src/index.js';

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

const PrimeApplicationProvider = ({ children }: { readonly children: ReactNode }) => (
    <PrimeReactProvider value={{ ripple: false }}>{children}</PrimeReactProvider>
);

const renderSlot = (
    slotId: (typeof stablePresentationSlots)[number],
    props: Readonly<Record<string, unknown>>,
) => {
    const declaration = primeReact10UiLibrary.slots[slotId];
    if (!declaration) throw new Error(`Missing ${slotId} declaration.`);
    // SAFETY: Fixture props are paired with their public slot contract.
    const Component = declaration.render as unknown as ComponentType<
        Record<string, unknown>
    >;
    return renderToStaticMarkup(
        <PrimeApplicationProvider>
            {createElement(Component, props)}
        </PrimeApplicationProvider>,
    );
};

const AdapterProvider = primeReact10UiLibrary.Provider;
if (!AdapterProvider) throw new Error('The PrimeReact 10 adapter provider is missing.');

const ConfigurationEvidence = () => {
    const configuration = useContext(PrimeReactContext);
    return <span data-ripple={String(configuration?.ripple)} />;
};

describe('when using the PrimeReact 10 stable presentation profile', () => {
    let report: ConformanceReport;

    beforeAll(async () => {
        report = await runConformance(primeReact10UiLibrary, {
            metadata: packageJson.cratis,
            document,
            wrapper: PrimeApplicationProvider,
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
        expect(primeReact10UiLibrary.profileSlots).to.deep.equal(stablePresentationSlots);
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

    it('should render actual PrimeReact 10 DOM identities for every slot', () => {
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
            switchControl: renderSlot('common.switch', {
                'aria-label': 'Enabled',
            }),
            progress: renderSlot('common.progress', { value: 42 }),
            surface: renderSlot('common.surface', { as: 'article' }),
        };
        expect(markup.button).to.contain('p-button');
        expect(markup.iconButton).to.contain('p-button');
        expect(markup.textInput).to.contain('p-inputtext');
        expect(markup.textArea).to.contain('p-inputtextarea');
        expect(markup.checkbox).to.contain('p-checkbox');
        expect(markup.radio).to.contain('p-radiobutton');
        expect(markup.switchControl).to.contain('p-inputswitch');
        expect(markup.switchControl).to.contain('role="switch"');
        expect(markup.progress).to.contain('p-progressbar');
        expect(markup.surface).to.contain('p-card');
        expect(markup.surface).to.contain('<article');
    });

    it('should render one selected checkbox indicator and truthful progress and loading states', () => {
        const unchecked = renderSlot('common.checkbox', {
            label: 'Unchecked',
        });
        const checked = renderSlot('common.checkbox', {
            label: 'Checked',
            checked: true,
        });
        const indeterminate = renderSlot('common.progress', {
            mode: 'indeterminate',
            value: 42,
        });
        const loading = renderSlot('common.button', {
            label: 'Saving',
            loading: true,
        });

        expect(unchecked.match(/data-cratis-part="indicator"/gu)).to.have.length(1);
        expect(unchecked).to.contain('hidden=""');
        expect(checked.match(/data-cratis-part="indicator"/gu)).to.have.length(1);
        expect(checked).not.to.contain('hidden=""');
        expect(indeterminate).not.to.contain('aria-valuemin');
        expect(indeterminate).not.to.contain('aria-valuenow');
        expect(indeterminate).not.to.contain('aria-valuemax');
        expect(loading).to.contain('p-button-loading-icon');
        expect(loading).to.contain('data-cratis-part="spinner"');
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

    it('should create default context only when no outer application provider exists', () => {
        const defaultMarkup = renderToStaticMarkup(
            <AdapterProvider setup={{}}>
                <ConfigurationEvidence />
            </AdapterProvider>,
        );
        const outerMarkup = renderToStaticMarkup(
            <PrimeReactProvider value={{ ripple: true }}>
                <AdapterProvider setup={{}}>
                    <ConfigurationEvidence />
                </AdapterProvider>
            </PrimeReactProvider>,
        );
        expect(defaultMarkup).to.contain('data-ripple="false"');
        expect(outerMarkup).to.contain('data-ripple="true"');
    });

    it('should pass through the Components provider without license setup', () => {
        const markup = renderToStaticMarkup(
            <PrimeApplicationProvider>
                <CratisComponentsProvider library={primeReact10UiLibrary}>
                    <Button label='Configured action' />
                </CratisComponentsProvider>
            </PrimeApplicationProvider>,
        );

        expect(markup).to.contain('p-button');
        expect(markup).to.contain('Configured action');
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

    it('should declare only bounded peer-hosted PrimeReact 10 vendors', () => {
        expect(packageJson).not.to.have.property('dependencies');
        expect(packageJson.peerDependencies).to.deep.equal({
            '@cratis/components': '>=3.0.0 <4',
            primereact: '>=10.9.9 <11',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
        });
        expect(packageJson.devDependencies).to.include({
            primereact: '10.9.9',
            react: '19.2.8',
            'react-dom': '19.2.8',
        });
        const serialized = JSON.stringify(packageJson);
        expect(serialized).not.to.contain('@primereact/');
        expect(serialized).not.to.contain('@primeui/');
        expect(serialized).not.to.contain('@primeuix/');
        expect(serialized).not.to.contain('LicenseRef-PrimeUI');
        expect(serialized).not.to.contain('license-configured');
    });

    it('should publish schema-valid MIT metadata without a key contract', () => {
        expect(packageJson.cratis.license).to.deep.equal({
            spdx: 'MIT',
            requiresKey: false,
        });
        expect(Object.hasOwn(primeReact10UiLibrary, 'license')).to.equal(false);
        expect(Object.hasOwn(primeReact10UiLibrary, 'keyEnv')).to.equal(false);
    });
});

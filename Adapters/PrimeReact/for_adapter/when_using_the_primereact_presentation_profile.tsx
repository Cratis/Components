// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { createElement, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrimeReactContext, defaultConfigProps } from '@primereact/core/config';
import { LocaleProvider } from '@primereact/core/locale';
import { PassThroughProvider } from '@primereact/core/passthrough';
import { ThemeProvider as PrimeThemeProvider } from '@primereact/core/theme';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';
import { Button } from '@cratis/components/Common';
import { runConformance, type ConformanceReport } from '@cratis/components.conformance';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
} from '@cratis/components/renderer';
import { beforeAll, describe, it } from 'vitest';
import packageJson from '../package.json';
import { primeReactUiLibrary } from '../src/index.js';

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

// SAFETY: PrimeReact's public context type includes the provider input shape, while its runtime
// value deliberately omits the license and adds mutable setters. These nine presentation fixtures
// need only the documented configuration values; using public contexts avoids invoking the real
// license manager with a fake credential.
const primeReactFixtureConfig = Object.freeze({ ...defaultConfigProps });

const PrimeApplicationProvider = ({ children }: { readonly children: ReactNode }) => (
    <PrimeReactContext.Provider value={primeReactFixtureConfig}>
        <LocaleProvider lang='en'>
            <PassThroughProvider mergeSections mergeProps>
                <PrimeThemeProvider preset={Aura}>{children}</PrimeThemeProvider>
            </PassThroughProvider>
        </LocaleProvider>
    </PrimeReactContext.Provider>
);

const renderSlot = (
    slotId: (typeof stablePresentationSlots)[number],
    props: Readonly<Record<string, unknown>>,
) => {
    const declaration = primeReactUiLibrary.slots[slotId];
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

const AdapterProvider = primeReactUiLibrary.Provider;
if (!AdapterProvider) throw new Error('The PrimeReact adapter provider is missing.');

const captureAdapterError = (render: () => unknown): unstable_AdapterError => {
    try {
        render();
    } catch (error: unknown) {
        if (error instanceof unstable_AdapterError) return error;
        throw error;
    }
    throw new Error('Expected adapter setup to fail.');
};

describe('when using the PrimeReact stable presentation profile', () => {
    let report: ConformanceReport;

    beforeAll(async () => {
        report = await runConformance(primeReactUiLibrary, {
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
        expect(primeReactUiLibrary.profileSlots).to.deep.equal(stablePresentationSlots);
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

    it('should render real PrimeReact 11 styled identities for every slot', () => {
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
        expect(markup.textArea).to.contain('p-textarea');
        expect(markup.checkbox).to.contain('p-checkbox');
        expect(markup.radio).to.contain('p-radiobutton');
        expect(markup.switchControl).to.contain('p-toggleswitch');
        expect(markup.switchControl).to.contain('role="switch"');
        expect(markup.progress).to.contain('p-progressbar');
        expect(markup.surface).to.contain('p-card');
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

    it('should fail closed with CRATIS-UI-1005 without both application attestations', () => {
        const missingOuterProvider = captureAdapterError(() =>
            renderToStaticMarkup(
                <AdapterProvider setup={{ 'cratis-primereact.license-configured': true }}>
                    <span />
                </AdapterProvider>,
            ),
        );
        expect(missingOuterProvider.code).to.equal(
            unstable_adapterErrorCodes.missingLicenseKey,
        );

        const missingLicenseAttestation = captureAdapterError(() =>
            renderToStaticMarkup(
                <PrimeApplicationProvider>
                    <AdapterProvider setup={{}}>
                        <span />
                    </AdapterProvider>
                </PrimeApplicationProvider>,
            ),
        );
        expect(missingLicenseAttestation.code).to.equal(
            unstable_adapterErrorCodes.missingLicenseKey,
        );

        const configured = renderToStaticMarkup(
            <PrimeApplicationProvider>
                <AdapterProvider setup={{ 'cratis-primereact.license-configured': true }}>
                    <span data-configured />
                </AdapterProvider>
            </PrimeApplicationProvider>,
        );
        expect(configured).to.contain('data-configured');
    });

    it('should pass the non-secret setup attestation through the Components provider', () => {
        const markup = renderToStaticMarkup(
            <PrimeApplicationProvider>
                <CratisComponentsProvider
                    library={primeReactUiLibrary}
                    rendererSetup={{
                        'cratis-primereact.license-configured': true,
                    }}
                >
                    <Button label='Configured action' />
                </CratisComponentsProvider>
            </PrimeApplicationProvider>,
        );

        expect(markup).to.contain('p-button');
        expect(markup).to.contain('Configured action');
    });

    it('should declare only bounded peer-hosted PrimeReact 11 vendors', () => {
        expect(packageJson).not.to.have.property('dependencies');
        expect(packageJson.peerDependencies).to.deep.equal({
            '@cratis/components': '>=4 <5',
            '@primereact/core': '>=11 <12',
            '@primereact/ui': '>=11 <12',
            '@primeuix/themes': '>=3 <4',
            primereact: '>=11 <12',
            react: '^19.0.0',
            'react-dom': '^19.0.0',
        });
        expect(packageJson.devDependencies).to.include({
            '@primereact/core': '11.1.0',
            '@primereact/ui': '11.1.0',
            '@primeuix/themes': '3.0.0',
            primereact: '11.1.0',
        });
        expect(JSON.stringify(packageJson)).not.to.contain('primereact@10');
    });

    it('should publish schema-valid key metadata without storing a key', () => {
        expect(packageJson.cratis.license).to.deep.equal({
            spdx: 'LicenseRef-PrimeUI',
            requiresKey: true,
            keyEnv: 'VITE_PRIMEUI_LICENSE_KEY',
            url: 'https://primeui.store/primeui',
        });
        expect(Object.hasOwn(primeReactUiLibrary, 'license')).to.equal(false);
        expect(Object.hasOwn(primeReactUiLibrary, 'keyEnv')).to.equal(false);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

vi.mock('@cratis/arc.react/commands', () => ({
    CommandFormFieldWrapper: ({ field }: { field: React.ReactElement }) => field,
}));

import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { markAsCommandFormField } from '../../CommandForm/commandFormMarkers';
import { CommandStepperContent } from '../CommandStepperContent';
import { StepperPanel } from '../StepperPanel';

const SampleField = markAsCommandFormField(
    (({ value: _value }: { value: (command: { sample: string }) => string }) => (
        <input aria-label='Sample field' />
    )) as ComponentType<{ value: (command: { sample: string }) => string }>,
);

describe('when CommandStepper renders authoritative states', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        // SAFETY: React's test-only act flag is intentionally absent from the DOM global type.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderStepper = async (busy: boolean, withError: boolean) => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <CommandStepperContent
                        activeStep={1}
                        visitedSteps={new Set([0, 1])}
                        isBusy={busy}
                        linear={false}
                        getFieldError={(fieldName) =>
                            withError && fieldName === 'sample' ? 'Required' : undefined
                        }
                        pt={{
                            root: { id: 'stepper-root' },
                            list: { id: 'stepper-list' },
                            step: { id: 'stepper-step' },
                            header: { id: 'stepper-header' },
                            number: { id: 'stepper-number' },
                            title: { id: 'stepper-title' },
                            separator: { id: 'stepper-separator' },
                            panels: { id: 'stepper-panels' },
                            panel: { id: 'stepper-panel' },
                        }}
                    >
                        <StepperPanel header='First'>
                            <SampleField value={(command) => command.sample} />
                        </StepperPanel>
                        <StepperPanel header='Second'>Second content</StepperPanel>
                    </CommandStepperContent>
                </CratisComponentsProvider>,
            );
        });
    };

    const parts = (name: string) => {
        switch (name) {
            case 'root':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="root"]',
                );
            case 'list':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="list"]',
                );
            case 'step':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="step"]',
                );
            case 'header':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="header"]',
                );
            case 'number':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="number"]',
                );
            case 'title':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="title"]',
                );
            case 'separator':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="separator"]',
                );
            case 'panels':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="panels"]',
                );
            case 'panel':
                return container.querySelectorAll<HTMLElement>(
                    '[data-cratis-part="panel"]',
                );
            default:
                throw new Error(`Unknown CommandStepper part: ${name}`);
        }
    };

    it('should put busy and aggregate invalid state on root collection parts and pt destinations', async () => {
        await renderStepper(true, true);

        for (const name of ['root', 'list', 'panels']) {
            const element = parts(name)[0];
            expect(element.dataset.busy).to.equal('true');
            expect(element.dataset.invalid).to.equal('true');
            expect(element.getAttribute('id')).to.equal(`stepper-${name}`);
        }
    });

    it('should put selected, visited, invalid, and busy on every relevant step part', async () => {
        await renderStepper(true, true);

        const steps = parts('step');
        expect(steps[0].hasAttribute('data-selected')).to.equal(false);
        expect(steps[0].dataset.visited).to.equal('true');
        expect(steps[0].dataset.invalid).to.equal('true');
        expect(steps[0].dataset.busy).to.equal('true');
        expect(steps[0].getAttribute('id')).to.equal('stepper-step');
        expect(steps[1].dataset.selected).to.equal('true');
        expect(steps[1].dataset.active).to.equal('true');
        expect(steps[1].dataset.visited).to.equal('true');
        expect(steps[1].hasAttribute('data-invalid')).to.equal(false);

        for (const name of ['header', 'number', 'title']) {
            const elements = parts(name);
            expect(elements[0].dataset.invalid).to.equal('true');
            expect(elements[0].dataset.visited).to.equal('true');
            expect(elements[0].hasAttribute('data-selected')).to.equal(false);
            expect(elements[1].dataset.selected).to.equal('true');
            expect(elements[1].dataset.visited).to.equal('true');
            expect(elements[1].hasAttribute('data-invalid')).to.equal(false);
            expect(elements[1].dataset.busy).to.equal('true');
            expect(elements[1].getAttribute('id')).to.equal(
                `stepper-${name}`,
            );
        }

        const headers = parts('header') as NodeListOf<HTMLButtonElement>;
        expect(headers[0].hasAttribute('data-disabled')).to.equal(false);
        expect(headers[0].disabled).to.equal(false);
        expect(headers[1].hasAttribute('data-disabled')).to.equal(false);
        expect(headers[1].disabled).to.equal(false);

        const separator = parts('separator')[0];
        expect(separator.dataset.visited).to.equal('true');
        expect(separator.dataset.invalid).to.equal('true');
        expect(separator.dataset.busy).to.equal('true');
        expect(separator.getAttribute('id')).to.equal('stepper-separator');
    });

    it('should put selected, visited, invalid, and busy on the corresponding panels', async () => {
        await renderStepper(true, true);

        const panels = parts('panel');
        expect(panels[0].hasAttribute('data-selected')).to.equal(false);
        expect(panels[0].dataset.visited).to.equal('true');
        expect(panels[0].dataset.invalid).to.equal('true');
        expect(panels[0].dataset.busy).to.equal('true');
        expect(panels[1].dataset.selected).to.equal('true');
        expect(panels[1].dataset.visited).to.equal('true');
        expect(panels[1].hasAttribute('data-invalid')).to.equal(false);
        expect(panels[1].getAttribute('id')).to.equal('stepper-panel');
    });

    it('should omit false invalid and busy states while preserving selected and visited migration attributes', async () => {
        await renderStepper(false, false);

        for (const name of [
            'root',
            'list',
            'step',
            'header',
            'number',
            'title',
            'separator',
            'panels',
            'panel',
        ]) {
            for (const element of parts(name)) {
                expect(element.hasAttribute('data-busy')).to.equal(false);
                expect(element.hasAttribute('data-invalid')).to.equal(false);
            }
        }

        const steps = parts('step');
        expect(steps[1].dataset.selected).to.equal('true');
        expect(steps[1].dataset.active).to.equal('true');
        expect(steps[0].dataset.visited).to.equal('true');
    });
});

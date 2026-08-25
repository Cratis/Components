// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { CommandStepperContent } from '../CommandStepperContent';
import { StepperPanel } from '../StepperPanel';

/**
 * Precedence coverage for the `stepper` provider message group's Next/Previous/Submit
 * navigation labels: a named component prop wins, then the provider message, then the
 * English fallback. `CommandStepperContent` is the visual body shared by the embedded
 * `CommandStepper` and (via `showNavigation={false}`, its own footer) `StepperCommandDialog`.
 */
describe('when CommandStepperContent uses provider messages', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (element: React.ReactElement) => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(element);
        });
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const buttonLabeled = (label: string) =>
        Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent === label,
        );

    it('should use the English fallback with no provider and no prop override', async () => {
        await render(
            <CratisComponentsProvider>
                <CommandStepperContent activeStep={0} visitedSteps={new Set([0])} />
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Submit')).not.to.equal(undefined);
    });

    it('should use the provider message for Next/Previous/Submit when no prop override is given', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        stepper: {
                            next: 'Provider Next',
                            previous: 'Provider Previous',
                            submit: 'Provider Submit',
                        },
                    },
                }}
            >
                <CommandStepperContent activeStep={1} visitedSteps={new Set([0, 1])}>
                    <StepperPanel header='First'>Content one</StepperPanel>
                    <StepperPanel header='Second'>Content two</StepperPanel>
                </CommandStepperContent>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Provider Previous')).not.to.equal(undefined);
        expect(buttonLabeled('Provider Submit')).not.to.equal(undefined);
    });

    it('should use the provider message for Next when not on the last step', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { stepper: { next: 'Provider Next' } } }}
            >
                <CommandStepperContent activeStep={0} visitedSteps={new Set([0])}>
                    <StepperPanel header='First'>Content one</StepperPanel>
                    <StepperPanel header='Second'>Content two</StepperPanel>
                </CommandStepperContent>
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Provider Next')).not.to.equal(undefined);
    });

    it('should prefer a named prop override over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { stepper: { submit: 'Provider Submit' } } }}
            >
                <CommandStepperContent
                    activeStep={0}
                    visitedSteps={new Set([0])}
                    okLabel='Explicit Submit'
                />
            </CratisComponentsProvider>,
        );
        expect(buttonLabeled('Explicit Submit')).not.to.equal(undefined);
        expect(buttonLabeled('Provider Submit')).to.equal(undefined);
    });
});

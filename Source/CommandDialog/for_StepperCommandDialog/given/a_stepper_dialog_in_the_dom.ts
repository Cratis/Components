// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * A `StepperCommandDialog` mounted into a real document, together with what is
 * needed to take it down again.
 *
 * Which step the wizard sits on is state the dialog owns, so a step vanishing
 * *after* the user has advanced past it can only be reached by driving the real
 * component: click through to the step, then render it again with the step gone.
 * Static markup always starts on step 0 and can never get there.
 */
export interface StepperDialogInTheDom {
    container: HTMLDivElement;
    root: Root;
}

/**
 * Renders an element into a real document and lets React settle.
 * @param element - The element to render.
 * @returns The mounted dialog, to be passed to {@link unmount}.
 */
export const render = async (element: React.ReactElement): Promise<StepperDialogInTheDom> => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(element);
    });

    return { container, root };
};

/**
 * Renders a new element into the same root, which is what a parent re-rendering
 * with a changed condition does — the dialog keeps the step state it had.
 * @param dialog - The mounted dialog.
 * @param element - The element to render in its place.
 */
export const rerender = async (dialog: StepperDialogInTheDom, element: React.ReactElement) => {
    await act(async () => {
        dialog.root.render(element);
    });
};

/**
 * Unmounts a dialog rendered with {@link render} and removes its container.
 * @param dialog - The mounted dialog.
 */
export const unmount = async (dialog: StepperDialogInTheDom) => {
    await act(async () => {
        dialog.root.unmount();
    });
    dialog.container.remove();
};

/**
 * Clicks a footer button by its visible label.
 * @param dialog - The mounted dialog.
 * @param label - The label of the button to click.
 */
export const click = async (dialog: StepperDialogInTheDom, label: string) => {
    const button = Array.from(dialog.container.querySelectorAll('button')).find(candidate => candidate.textContent === label);

    await act(async () => {
        button?.click();
    });
};

/**
 * The labels of every button the dialog currently offers. Rendered elements come
 * from the jsdom realm and carry no `should`, so the footer is described as plain
 * strings — and a failure then says which buttons were offered instead of only
 * that a lookup came back empty.
 * @param dialog - The mounted dialog.
 * @returns The button labels, in document order.
 */
export const buttonLabels = (dialog: StepperDialogInTheDom): string[] =>
    Array.from(dialog.container.querySelectorAll('button')).map(button => button.textContent ?? '');

/**
 * The footer laid out the way it is composed: every button by its label, and the flexible spacer
 * that divides the dismissal side from the progression side as `'spacer'`. Buttons on their own
 * cannot say which side of that spacer a button sits on, and on a step that offers no Previous
 * that is the only thing separating "leads the footer" from "trails it".
 * @param dialog - The mounted dialog.
 * @returns The footer's children, in document order.
 */
export const footerLayout = (dialog: StepperDialogInTheDom): string[] => {
    const footer = dialog.container.querySelector('[data-testid="dialog"]')?.firstElementChild;

    return Array.from(footer?.children ?? [])
        .map(child => child.tagName === 'BUTTON' ? child.textContent ?? '' : 'spacer');
};

/**
 * The labels of the buttons the dialog currently renders as disabled, in document order.
 * Read alongside {@link buttonLabels} so a spec can tell "the button is disabled" apart
 * from "the button is not there at all".
 * @param dialog - The mounted dialog.
 * @returns The disabled button labels, in document order.
 */
export const disabledButtonLabels = (dialog: StepperDialogInTheDom): string[] =>
    Array.from(dialog.container.querySelectorAll('button'))
        .filter(button => button.disabled)
        .map(button => button.textContent ?? '');

/**
 * Runs work that resolves a promise the spec itself holds - settling a command execution,
 * say - and lets React process everything it triggers before returning.
 * @param work - The work to run.
 */
export const settle = async (work: () => void) => {
    await act(async () => {
        work();
    });
};

/**
 * The headers of the step panels the wizard actually rendered, in render order.
 * @param dialog - The mounted dialog.
 * @returns The step headers.
 */
export const renderedSteps = (dialog: StepperDialogInTheDom): string[] =>
    Array.from(dialog.container.querySelectorAll('[data-testid="stepper-panel"]'))
        .map(panel => panel.getAttribute('data-header') ?? '');

/**
 * The step index the wizard handed the Stepper, or `'none'` when no stepper was
 * rendered at all.
 * @param dialog - The mounted dialog.
 * @returns The active step index as a string.
 */
export const activeStep = (dialog: StepperDialogInTheDom): string =>
    dialog.container.querySelector('[data-testid="stepper"]')?.getAttribute('data-active-step') ?? 'none';

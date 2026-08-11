// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepper, CommandStepperContent } from '../../CommandStepper';
import { StepperPanel } from 'primereact/stepperpanel';

const { buttonClicks } = vi.hoisted(() => ({ buttonClicks: new Map<string, () => void>() }));

vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode; activeStep?: number }) =>
        React.createElement('div', { 'data-testid': 'stepper', 'data-active-step': props.activeStep }, props.children),
}));

vi.mock('primereact/stepperpanel', () => ({
    StepperPanel: (props: { header?: string; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'stepper-panel', 'data-header': props.header }, props.children),
}));

// Only an enabled button is clickable, so only an enabled button is recorded.
vi.mock('primereact/button', () => ({
    Button: (props: { label?: string; disabled?: boolean; onClick?: () => void }) => {
        if (props.label && props.disabled !== true) buttonClicks.set(props.label, () => props.onClick?.());
        return React.createElement('button', { disabled: props.disabled }, props.label);
    },
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
        getFieldError: () => undefined,
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

const renderedPanels = (html: string) => html.split('data-testid="stepper-panel"').length - 1;

const panel = (header: string) => React.createElement(StepperPanel, { header, key: header }, `${header} content`);

const renderStepper = (...children: React.ReactNode[]) => renderToStaticMarkup(React.createElement(
    CommandStepper<TestCommand>,
    { command: TestCommand as unknown as new () => object },
    ...children
));

/**
 * Drives CommandStepperContent as a controlled wizard: render, click Next, render again,
 * until Next is gone. The step it comes to rest on is the furthest the user can navigate.
 */
const walkForward = (children: React.ReactNode) => {
    let activeStep = 0;
    let visitedSteps = new Set<number>([0]);
    let html = '';

    const render = () => {
        buttonClicks.clear();
        html = renderToStaticMarkup(React.createElement(CommandStepperContent, {
            activeStep,
            visitedSteps,
            onActiveStepChange: (stepIndex: number) => { activeStep = stepIndex; },
            onVisitedStepsChange: (steps: Set<number>) => { visitedSteps = steps; },
            children
        }));
    };

    render();
    for (let guard = 0; guard < 10 && buttonClicks.has('Next'); guard++) {
        buttonClicks.get('Next')!();
        render();
    }

    return { activeStep, html };
};

// Exactly how a conditional step is written in an application: `{condition && <StepperPanel/>}`.
const showOptionalStep: boolean = false;

// Two hidden steps: a fix that merely decremented the count by one would still be wrong here.
describe('when two of three steps are hidden and the stepper is on the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderStepper(panel('Step 1'), showOptionalStep && panel('Step 2'), showOptionalStep && panel('Step 3'));
    });

    it('should_render_only_the_surviving_steps', () => {
        renderedPanels(html).should.equal(1);
    });

    it('should_show_the_submit_button', () => {
        html.should.include('>Submit<');
    });

    it('should_not_show_the_next_button', () => {
        html.should.not.include('>Next<');
    });
});

describe('when two of four steps are hidden and the user walks forward', () => {
    let result: { activeStep: number; html: string };

    beforeEach(() => {
        result = walkForward([panel('Step 1'), showOptionalStep && panel('Step 2'), panel('Step 3'), showOptionalStep && panel('Step 4')]);
    });

    it('should_stop_on_the_last_rendered_step', () => {
        result.activeStep.should.equal(1);
    });

    it('should_show_the_submit_button_there', () => {
        result.html.should.include('>Submit<');
    });

    it('should_not_offer_another_next_step', () => {
        result.html.should.not.include('>Next<');
    });
});

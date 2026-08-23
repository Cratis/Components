// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepper, CommandStepperContent } from '../../CommandStepper';
import { StepperPanel } from '../../StepperPanel';

const { buttonClicks } = vi.hoisted(() => ({ buttonClicks: new Map<string, () => void>() }));

// PrimeReact 11's Stepper is compositional: each part renders its children, so every step
// the wizard renders shows up as one `data-part="panel"` element, and the Number part
// forwards the inline `style` carrying the per-step indicator color.
;


// PrimeReact 11's Button takes its label as children, not a `label` prop, so the label a
// button is recorded under is the text its children carry (the icon contributes none).
// Only an enabled button is clickable, so only an enabled button is recorded.
vi.mock('../../../Common/Button', () => {
    const labelOf = (children: React.ReactNode): string => {
        let label = '';
        React.Children.forEach(children, child => {
            if (typeof child === 'string') label += child;
            else if (React.isValidElement(child)) label += labelOf((child.props as { children?: React.ReactNode }).children);
        });
        return label;
    };
    return {
        Button: (props: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void }) => {
            const label = labelOf(props.children);
            if (label && props.disabled !== true) buttonClicks.set(label, () => props.onClick?.());
            return React.createElement('button', { disabled: props.disabled }, props.children);
        },
    };
});

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

const renderedPanels = (html: string) => html.split('data-part="panel"').length - 1;

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

const hiddenStep = null;

describe('when the last of two steps is null and the stepper is on the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderStepper(panel('Step 1'), hiddenStep);
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

describe('when the last of three steps is null and the user walks forward', () => {
    let result: { activeStep: number; html: string };

    beforeEach(() => {
        result = walkForward([panel('Step 1'), panel('Step 2'), hiddenStep]);
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

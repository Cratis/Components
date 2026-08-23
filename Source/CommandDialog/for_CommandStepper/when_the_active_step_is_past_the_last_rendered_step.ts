// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepperContent } from '../CommandStepper';
import { StepperPanel } from '../StepperPanel';

// PrimeReact 11's Stepper is compositional: each part renders its children, so every step
// the wizard renders shows up as one `data-part="panel"` element. The step the wizard is on
// is no longer an `activeStep` prop — the Root is driven by `value`, the step's index as a
// string — so the Root part surfaces that value for the spec to read.
;

// PrimeReact 11's Button takes its label as children, not a `label` prop.
vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => { },
        setCommandResult: () => { },
        getFieldError: () => undefined,
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

const panel = (header: string) => React.createElement(StepperPanel, { header, key: header }, `${header} content`);

const activeStepOf = (html: string) => html.match(/data-part="root"[^>]*data-value="(\d+)"/)?.[1] ?? 'none';

// The active step is a prop here, and the owner of that state - CommandStepper's own wrapper, or
// StepperCommandDialog - keeps it across a re-render. So a step vanishing after the user advanced
// past it hands this component an index no rendered panel answers to, which is exactly the shape
// reproduced below: three steps were walked, the middle one then went away.
describe('when the active step is past the last rendered step', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(CommandStepperContent, {
            activeStep: 2,
            visitedSteps: new Set<number>([0, 1, 2]),
            children: [panel('Step 1'), false, panel('Step 3')]
        }));
    });

    it('should_render_only_the_surviving_steps', () => {
        (html.split('data-part="panel"').length - 1).should.equal(2);
    });

    it('should_hand_the_stepper_the_last_step_that_still_exists', () => {
        activeStepOf(html).should.equal('1');
    });

    it('should_show_the_submit_button', () => {
        html.should.include('>Submit<');
    });

    it('should_not_show_the_next_button', () => {
        html.should.not.include('>Next<');
    });
});

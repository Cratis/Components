// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepperContent } from '../CommandStepper';



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

// The body is a published component in its own right, and standalone it renders the footer the
// dialog suppresses - `showNavigation` defaults to true there. So a consumer whose every step is
// `{condition && <StepperPanel/>}` with every condition false has no steps at all, and the footer
// is the only thing the wizard offers: Next would lead nowhere, and without Submit the wizard
// cannot be finished. The last-step test has to hold for zero steps, which is the one count where
// an equality against `stepCount - 1` stops matching.
describe('when every step is hidden', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(CommandStepperContent, {
            activeStep: 0,
            visitedSteps: new Set<number>([0]),
            children: [false, false]
        }));
    });

    it('should_show_the_submit_button', () => {
        html.should.include('>Submit<');
    });

    it('should_not_show_the_next_button', () => {
        html.should.not.include('>Next<');
    });
});

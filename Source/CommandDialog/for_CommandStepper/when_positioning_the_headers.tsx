// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepperContent } from '../CommandStepperContent';
import { StepperPanel } from '../StepperPanel';

vi.mock('../../Common/Button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

const render = (headerPosition?: 'top' | 'bottom', labels: { nextLabel?: string } = {}) =>
    renderToStaticMarkup(React.createElement(CommandStepperContent, {
        activeStep: 0,
        visitedSteps: new Set<number>(),
        headerPosition,
        ...labels,
        children: [
            React.createElement(StepperPanel, { key: 'one', header: 'One' }, 'first'),
            React.createElement(StepperPanel, { key: 'two', header: 'Two' }, 'second'),
        ],
    }));

describe('when positioning the headers', () => {
    let atTop: string;
    let atBottom: string;
    let withCustomLabel: string;

    beforeEach(() => {
        atTop = render('top');
        atBottom = render('bottom');
        withCustomLabel = render(undefined, { nextLabel: 'Continue' });
    });

    it('should_render_the_list_before_the_panels_at_the_top', () => {
        atTop.indexOf('data-part="list"').should.be.lessThan(atTop.indexOf('data-part="panels"'));
    });

    it('should_render_the_panels_before_the_list_at_the_bottom', () => {
        atBottom.indexOf('data-part="panels"').should.be.lessThan(atBottom.indexOf('data-part="list"'));
    });

    it('should_use_a_custom_next_label', () => {
        withCustomLabel.should.include('>Continue<');
    });

    it('should_default_the_next_label', () => {
        atTop.should.include('>Next<');
    });
});

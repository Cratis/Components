// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepper, CommandStepperContent } from '../../CommandStepper';
import { StepperPanel } from 'primereact/stepperpanel';

const { buttonClicks } = vi.hoisted(() => ({ buttonClicks: new Map<string, () => void>() }));

// Stands in for PrimeReact's Stepper: it invokes pt.stepperpanel.number for each panel it
// renders — by the index it renders it at — and surfaces the resulting background color.
vi.mock('primereact/stepper', () => ({
    Stepper: (props: { children?: React.ReactNode; pt?: Record<string, unknown> }) => {
        type StepContext = { context: { index: number } };
        type NumberPtFn = (opts: StepContext) => { style?: { backgroundColor?: string } };
        const stepperPanelPt = (props.pt as Record<string, unknown> | undefined)?.stepperpanel as Record<string, unknown> | undefined;
        const numberPt = stepperPanelPt?.number as NumberPtFn | undefined;
        const children = React.Children.map(props.children, (child, index) => {
            if (!React.isValidElement(child)) return child;
            const result = typeof numberPt === 'function' ? numberPt({ context: { index } }) : {};
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                'data-number-bg': result?.style?.backgroundColor ?? ''
            });
        });
        return React.createElement('div', { 'data-testid': 'stepper' }, children);
    },
}));

vi.mock('primereact/stepperpanel', () => {
    const MockStepperPanel = (props: { header?: string; children?: React.ReactNode; 'data-number-bg'?: string }) =>
        React.createElement('div', {
            'data-testid': 'stepper-panel',
            'data-header': props.header,
            'data-number-bg': props['data-number-bg'] ?? '',
        }, props.children);
    MockStepperPanel.displayName = 'StepperPanel';
    return { StepperPanel: MockStepperPanel };
});

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
        getFieldError: (fieldName: string) => fieldName === 'name' ? 'Name is required' : undefined,
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
    description: string = '';
}

// A stand-in for a CommandForm field — the displayName is what the field-name extraction keys on.
const NameField = (props: { value?: (command: TestCommand) => unknown }) => {
    void props;
    return React.createElement('div', null);
};
NameField.displayName = 'CommandFormField';

const numberBackgroundOf = (html: string, header: string) =>
    html.match(new RegExp(`data-header="${header}"[^>]*data-number-bg="([^"]*)"`))?.[1] ?? '';

// Exactly how a conditional step is written in an application: `{condition && <StepperPanel/>}`.
const showOptionalStep: boolean = false;

const steps = () => [
    React.createElement(StepperPanel, { header: 'Contact', key: 'contact' }, 'No fields here'),
    showOptionalStep && React.createElement(StepperPanel, { header: 'Optional', key: 'optional' }, 'Hidden'),
    React.createElement(
        StepperPanel,
        { header: 'Details', key: 'details' },
        React.createElement(NameField, { value: (command: TestCommand) => command.name })
    )
];

describe('when the hidden step sits between two rendered steps', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(
            CommandStepper<TestCommand>,
            { command: TestCommand as unknown as new () => object },
            ...steps()
        ));
    });

    it('should_render_only_the_two_surviving_steps', () => {
        html.split('data-testid="stepper-panel"').length.should.equal(3);
    });

    it('should_not_mark_the_step_without_field_errors', () => {
        numberBackgroundOf(html, 'Contact').should.not.include('red');
    });

    it('should_mark_the_step_whose_own_field_has_an_error', () => {
        numberBackgroundOf(html, 'Details').should.include('red');
    });

    it('should_show_the_next_button_on_the_first_of_two_steps', () => {
        html.should.include('>Next<');
    });
});

describe('when the hidden step sits in the middle and the user walks forward', () => {
    let activeStep: number;
    let html: string;

    beforeEach(() => {
        let visitedSteps = new Set<number>([0]);
        activeStep = 0;

        const render = () => {
            buttonClicks.clear();
            html = renderToStaticMarkup(React.createElement(CommandStepperContent, {
                activeStep,
                visitedSteps,
                onActiveStepChange: (stepIndex: number) => { activeStep = stepIndex; },
                onVisitedStepsChange: (updated: Set<number>) => { visitedSteps = updated; },
                children: steps()
            }));
        };

        render();
        for (let guard = 0; guard < 10 && buttonClicks.has('Next'); guard++) {
            buttonClicks.get('Next')!();
            render();
        }
    });

    it('should_stop_on_the_last_rendered_step', () => {
        activeStep.should.equal(1);
    });

    it('should_not_offer_another_next_step', () => {
        html.should.not.include('>Next<');
    });
});

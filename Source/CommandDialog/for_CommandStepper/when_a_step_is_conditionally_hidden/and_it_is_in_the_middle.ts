// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandStepper, CommandStepperContent } from '../../CommandStepper';
import { StepperPanel } from '../../StepperPanel';

const { buttonClicks } = vi.hoisted(() => ({
    buttonClicks: new Map<string, () => void>(),
}));

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
        React.Children.forEach(children, (child) => {
            if (typeof child === 'string') label += child;
            else if (React.isValidElement(child))
                label += labelOf(
                    (child.props as { children?: React.ReactNode }).children,
                );
        });
        return label;
    };
    return {
        Button: (props: {
            children?: React.ReactNode;
            disabled?: boolean;
            onClick?: () => void;
        }) => {
            const label = labelOf(props.children);
            if (label && props.disabled !== true)
                buttonClicks.set(label, () => props.onClick?.());
            return React.createElement(
                'button',
                { disabled: props.disabled },
                props.children,
            );
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
        getFieldError: (fieldName: string) =>
            fieldName === 'name' ? 'Name is required' : undefined,
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

// The step number and its title are siblings inside the step header, so the number
// belonging to a named step is the one immediately preceding that step's title.
const stepStateOf = (html: string, header: string) =>
    (html.match(/<li[^>]*data-cratis-part="step"[^>]*>[\s\S]*?<\/li>/g) ?? [])
        .find((step) => step.includes(`>${header}</span>`)) ?? '';

// Exactly how a conditional step is written in an application: `{condition && <StepperPanel/>}`.
const showOptionalStep: boolean = false;

const steps = () => [
    React.createElement(
        StepperPanel,
        { header: 'Contact', key: 'contact' },
        'No fields here',
    ),
    showOptionalStep &&
        React.createElement(
            StepperPanel,
            { header: 'Optional', key: 'optional' },
            'Hidden',
        ),
    React.createElement(
        StepperPanel,
        { header: 'Details', key: 'details' },
        React.createElement(NameField, { value: (command: TestCommand) => command.name }),
    ),
];

describe('when the hidden step sits between two rendered steps', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            React.createElement(
                CommandStepper<TestCommand>,
                {
                    // SAFETY: The generated command proxy constructor is erased by this SSR harness only.
                    command: TestCommand as unknown as new () => object,
                },
                ...steps(),
            ),
        );
    });

    it('should_render_only_the_two_surviving_steps', () => {
        html.split('data-part="panel"').length.should.equal(3);
    });

    it('should_not_mark_the_step_without_field_errors', () => {
        stepStateOf(html, 'Contact').should.not.include('data-invalid');
    });

    it('should_mark_the_step_whose_own_field_has_an_error', () => {
        stepStateOf(html, 'Details').should.include('data-invalid="true"');
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
            html = renderToStaticMarkup(
                React.createElement(CommandStepperContent, {
                    activeStep,
                    visitedSteps,
                    onActiveStepChange: (stepIndex: number) => {
                        activeStep = stepIndex;
                    },
                    onVisitedStepsChange: (updated: Set<number>) => {
                        visitedSteps = updated;
                    },
                    children: steps(),
                }),
            );
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

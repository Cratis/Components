// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandFormFieldDisplayName, markAsCommandFormField } from '../../CommandForm/commandFormMarkers';

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
}));

// PrimeReact 11's Stepper is compositional: each part renders its children, and
// the Number part forwards its inline `style` so specs can assert the per-step
// red/green indicator the wrapper applies directly to each step's number.
vi.mock('primereact/stepper', () => {
    const part = (name: string) => {
        const Component = (props: { children?: React.ReactNode; style?: React.CSSProperties }) =>
            React.createElement('div', { 'data-part': name, style: props.style }, props.children);
        Component.displayName = name;
        return Component;
    };
    return {
        Stepper: {
            Root: part('root'), List: part('list'), Step: part('step'),
            Header: part('header'), Number: part('number'), Title: part('title'),
            Separator: part('separator'), Panels: part('panels'), Panel: part('panel'),
        },
    };
});

vi.mock('primereact/button', () => ({
    Button: (props: { children?: React.ReactNode; disabled?: boolean }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

// isValid: true — only getFieldError drives the per-step indicator, and it can
// only be consulted for a field whose name was successfully extracted.
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
    // Tagged so the markup shows whether the stepper recognized the child as a
    // field and wrapped it. An unrecognized child is returned untouched — no
    // container, so no label, no bound value and no change handler.
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'field-wrapper' }, props.field),
}));

const overwriteDisplayName = (component: object, name: string): void => {
    (component as { displayName?: string }).displayName = name;
};

class TestCommand {
    name: string = '';
    description: string = '';
}

// Marked as `asCommandFormField` marks a field, then renamed by a build transform.
const RenamedField = markAsCommandFormField((props: { value?: (c: TestCommand) => unknown }) => {
    void props;
    return React.createElement('div', { 'data-testid': 'the-field' });
});
overwriteDisplayName(RenamedField, 'AppInputTextField');

describe('when a stepper field displayName has been overwritten by a build transform', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate under this
        // file's own mocks so the getFieldError stub driving the step indicator is
        // always the one in effect.
        vi.resetModules();
        const { StepperCommandDialog } = await import('../StepperCommandDialog');
        const { StepperPanel } = await import('../StepperPanel');

        const element = React.createElement(
            StepperCommandDialog<TestCommand>,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(
                StepperPanel,
                { header: 'Step 1' },
                React.createElement(RenamedField, { value: (c: TestCommand) => c.name })
            ),
            React.createElement(StepperPanel, { header: 'Step 2' }, 'No fields here')
        );
        html = renderToStaticMarkup(element);
    });

    // Covers the read in processChildren.
    it('should still recognize the child as a field and wrap it', () => {
        html.should.include('field-wrapper');
    });

    it('should still render the field itself', () => {
        html.should.include('the-field');
    });

    // Covers the read in extractFieldNamesFromNode: the step indicator can only
    // turn red if the field was recognized and its property name extracted.
    it('should still extract the field name for the step indicator', () => {
        const step1Number = html.match(/<span data-part="number"[^>]*>1<\/span>|<div data-part="number"[^>]*>1<\/div>/);
        (step1Number?.[0] ?? '').should.include('red');
    });

    it('should not mark the step that has no fields', () => {
        const step2Number = html.match(/<span data-part="number"[^>]*>2<\/span>|<div data-part="number"[^>]*>2<\/div>/);
        (step2Number?.[0] ?? '').should.not.include('red');
    });

    // Guards every assertion above: were the overwrite to silently fail, they
    // would pass through the legacy fallback and prove nothing about the marker.
    it('should have actually lost the legacy display name', () => {
        (RenamedField as { displayName?: string }).displayName!
            .should.not.equal(CommandFormFieldDisplayName);
    });
});

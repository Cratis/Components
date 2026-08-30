// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it, vi } from 'vitest';
import { CommandFormFieldDisplayName, markAsCommandFormField } from '../../CommandForm/commandFormMarkers';

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: { buttons?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'dialog' }, props.buttons, props.children),
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

const overwriteDisplayName = (
    component: { displayName?: string },
    name: string,
): void => {
    component.displayName = name;
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
                // SAFETY: The local Arc module mock erases the generated command base type;
                // TestCommand supplies the shape this StepperCommandDialog spec exercises.
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
        expect(html).to.include('field-wrapper');
    });

    it('should still render the field itself', () => {
        expect(html).to.include('the-field');
    });

    // Covers the read in extractFieldNamesFromNode: the first step can only
    // carry invalid state if the field was recognized and its property extracted.
    it('should still extract the field name for the step indicator', () => {
        const steps =
            html.match(/<li[^>]*data-cratis-part="step"[^>]*>/g) ?? [];
        expect(steps[0] ?? '').to.include('data-invalid="true"');
    });

    it('should not mark the step that has no fields', () => {
        const steps =
            html.match(/<li[^>]*data-cratis-part="step"[^>]*>/g) ?? [];
        expect(steps[1] ?? '').not.to.include('data-invalid');
    });

    // Guards every assertion above: were the overwrite to silently fail, they
    // would pass through the legacy fallback and prove nothing about the marker.
    it('should have actually lost the legacy display name', () => {
        expect((RenamedField as { displayName?: string }).displayName).not.to.equal(
            CommandFormFieldDisplayName,
        );
    });
});

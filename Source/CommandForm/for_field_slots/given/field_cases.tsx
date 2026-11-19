// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { CheckboxField } from '../../fields/CheckboxField';
import { InputTextField } from '../../fields/InputTextField';
import { NumberField } from '../../fields/NumberField';
import { RadioButtonField } from '../../fields/RadioButtonField';
import { RadioGroupField } from '../../fields/RadioGroupField';
import { TextAreaField } from '../../fields/TextAreaField';
import { ToggleSwitchField } from '../../fields/ToggleSwitchField';

/** Props Arc's field wrapper supplies to a wrapped command-form field. */
export const arcProps = {
    invalid: false,
    required: false,
    errors: [] as string[],
    onChange: () => undefined,
    onBlur: () => undefined,
};

export const asDirectComponent = (component: unknown) =>
    component as ComponentType<Record<string, unknown>>;

const options = [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
];
const radioGroup = { options, optionValue: 'id', optionLabel: 'label', name: 'choice' };

/** One field and the props it is rendered with; shared by the golden and adapter specs. */
export interface FieldCase {
    name: string;
    component: unknown;
    props: Record<string, unknown>;
}

export const fieldCases: FieldCase[] = [
    { name: 'text', component: InputTextField, props: { value: 'Ada', title: 'Name', placeholder: 'Who' } },
    { name: 'email', component: InputTextField, props: { value: 'a@b.c', type: 'email', id: 'mail' } },
    {
        name: 'text with parts',
        component: InputTextField,
        props: {
            value: '',
            className: 'consumer',
            pt: { root: { className: 'part', id: 'part-id', disabled: true, readOnly: true, 'aria-label': 'Parted', 'aria-describedby': 'hint' } },
        },
    },
    { name: 'invalid text', component: InputTextField, props: { value: 'x', invalid: true, errors: ['Bad value', 'Worse'], title: 'Name' } },
    { name: 'number', component: NumberField, props: { value: 5, title: 'Count', placeholder: 'How many', min: 0, max: 10, step: 1 } },
    { name: 'number with parts', component: NumberField, props: { value: 0, invalid: true, errors: ['Too low'], className: 'consumer', pt: { root: { className: 'r' }, input: { className: 'i', id: 'num-id', disabled: true, readOnly: true, 'aria-label': 'Counted', 'aria-describedby': 'hint' } } } },
    { name: 'textarea', component: TextAreaField, props: { value: 'Long', rows: 3, cols: 20, title: 'Notes' } },
    { name: 'textarea defaults', component: TextAreaField, props: { value: '', className: 'consumer', pt: { root: { className: 'part' } } } },
    { name: 'checkbox', component: CheckboxField, props: { value: true, label: 'Agree', title: 'Agree', className: 'consumer' } },
    { name: 'checkbox with parts', component: CheckboxField, props: { value: false, label: 'Agree', invalid: true, errors: ['Required'], pt: { root: { className: 'r' }, input: { className: 'i', disabled: true }, box: { className: 'b' }, indicator: { className: 'n' } } } },
    { name: 'checkbox without label', component: CheckboxField, props: { value: false } },
    { name: 'switch', component: ToggleSwitchField, props: { value: true, label: 'Enabled', className: 'consumer' } },
    { name: 'switch with parts', component: ToggleSwitchField, props: { value: false, invalid: true, pt: { root: { className: 'r' }, input: { className: 'i' }, control: { className: 'c' }, handle: { className: 'h' } } } },
    { name: 'radio group', component: RadioGroupField, props: { ...radioGroup, value: 'two', title: 'Choice' } },
    { name: 'horizontal radio group', component: RadioGroupField, props: { ...radioGroup, value: 'one', layout: 'horizontal', className: 'consumer', invalid: true, errors: ['Pick one'], pt: { root: { className: 'g' }, option: { className: 'o' }, input: { className: 'i', id: 'shared' }, box: { className: 'b' }, indicator: { className: 'n' } } } },
    { name: 'radio button', component: RadioButtonField, props: { value: 'a', buttonValue: 'a', name: 'grp', label: 'A', className: 'consumer' } },
    { name: 'radio button with parts', component: RadioButtonField, props: { value: 'a', buttonValue: 'b', name: 'grp', label: 'B', invalid: true, errors: ['No'], pt: { root: { className: 'r' }, input: { className: 'i' }, box: { className: 'b' }, indicator: { className: 'n' } } } },
];

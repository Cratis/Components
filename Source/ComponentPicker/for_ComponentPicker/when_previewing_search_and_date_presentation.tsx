// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { vi } from 'vitest';
import { ComboBox } from '../../Common/ComboBox';
import { DatePickerInput, type DatePickerInputProps } from '../../Common/DatePickerInput';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { ComponentMarkerAttributes } from '../../configuration/identity/ComponentMarkerAttributes';
import { knownComponentDescriptors, previewPresentationChanges, registeredComponentFor } from '../../configuration/identity/componentInstances';
import { createTestLibrary } from '../../renderer/for_resolution/testLibrary';
import { describeComponentElement } from '../describeComponentElement';
import { proposedChanges } from '../proposedChanges';
import { click, hover, mountScreen, startPicking, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const AdapterDatePicker = (props: DatePickerInputProps) => {
    const marker = props as DatePickerInputProps & ComponentMarkerAttributes;
    return <section
        data-cratis-component={marker['data-cratis-component']}
        data-cratis-component-id={marker['data-cratis-component-id']}
        data-cratis-component-instance={marker['data-cratis-component-instance']}
        data-adapter='date'
        data-invalid={props.invalid || undefined}
    ><input id={props.id} aria-label={props['aria-label']} placeholder={props.placeholder} value={props.value?.toISOString() ?? ''} readOnly /></section>;
};
const dateLibrary = createTestLibrary('example-date-presentation', {
    'display.datePicker': { mode: 'atomic', fidelity: 'native', render: AdapterDatePicker },
});
const onChange = vi.fn();
const options = [{ key: 'example-one', label: 'Example option', description: <strong>Example details</strong> }];
const renderComboBox = (id?: string) => <ComboBox id={id} name='example-search' options={options} value='example-one'
    onChange={onChange} aria-label='Example control' placeholder='Example placeholder' invalid={false} />;
const renderDatePicker = (id?: string) => <DatePickerInput id={id} value={null} onChange={onChange}
    aria-label='Example control' placeholder='Example placeholder' invalid={false} />;
const examples = [
    { component: 'ComboBox', render: renderComboBox, library: undefined },
    { component: 'DatePickerInput', render: renderDatePicker, library: undefined },
    { component: 'DatePickerInput', render: renderDatePicker, library: dateLibrary },
];
const properties = [
    { name: 'placeholder', label: 'Placeholder', type: 'string' },
    { name: 'aria-label', label: 'Accessible label', type: 'string' },
    { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
];
const valuesOf = (element: HTMLElement) => describeComponentElement(element).presentationProperties.map(({ name, value, editable }) => ({ name, value, editable }));
const originalValues = [
    { name: 'placeholder', value: 'Example placeholder', editable: true },
    { name: 'aria-label', value: 'Example control', editable: true },
    { name: 'invalid', value: false, editable: true },
];
const changes = [
    { property: 'placeholder', from: 'Example placeholder', to: 'Preview placeholder' },
    { property: 'aria-label', from: 'Example control', to: 'Preview control' },
    { property: 'invalid', from: false, to: true },
];
const placeholderOf = (element: HTMLElement) => element.querySelector('[data-cratis-part="placeholder"]')?.textContent
    ?? element.querySelector<HTMLInputElement>('input')!.placeholder;

for (const { component, render, library } of examples) {
    describe(`when previewing ${component} presentation through ${library ? 'an adapter' : 'Core'}`, () => {
        let screen: ScreenInTheDom;
        let element: HTMLElement;
        let other: HTMLElement;

        beforeEach(async () => {
            onChange.mockClear();
            screen = await mountScreen(<CratisComponentsProvider library={library}>
                {render('example-id')}{render()}
            </CratisComponentsProvider>);
            [element, other] = Array.from(screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${component}"]`));
        });

        afterEach(async () => {
            screen.picker().cancel();
            await unmountScreen(screen);
        });

        it('should register the exact typed presentation properties once on each public root', () => {
            const registration = registeredComponentFor(element)!;
            registration.descriptor.properties.should.deep.equal(properties);
            [knownComponentDescriptors().find((descriptor) => descriptor.component === component)].should.deep.equal([registration.descriptor]);
            valuesOf(element).should.deep.equal(originalValues);
            element.dataset.cratisComponentInstance!.should.not.equal(other.dataset.cratisComponentInstance);
            element.dataset.cratisComponentInstance!.should.not.equal('');
            element.dataset.cratisComponentId!.should.equal('example-id');
            [other.dataset.cratisComponentId].should.deep.equal([component === 'ComboBox' ? 'example-search' : undefined]);
            element.querySelectorAll('[data-cratis-component-instance]').length.should.equal(0);
            registration.props.should.include({ onChange });
        });

        it('should pick registered prop values rather than arbitrary DOM attributes', async () => {
            element.querySelector('[aria-label="Example control"]')!.setAttribute('aria-label', 'DOM-only name');
            element.setAttribute('data-invalid', 'true');
            const pending = await startPicking(screen);
            await hover(element);
            await click(element);
            const picked = (await pending.result)!;
            picked.component.should.equal(component);
            picked.presentationProperties.map(({ name, value, editable }) => ({ name, value, editable })).should.deep.equal(originalValues);
        });

        it('should preview and revert only the target while preserving original registration and callbacks', async () => {
            const original = registeredComponentFor(element)!.props;
            const originalInputValue = element.querySelector<HTMLInputElement>('input')?.value;
            let revert!: () => void;
            await act(async () => { revert = previewPresentationChanges(element, changes); });
            placeholderOf(element)!.should.equal('Preview placeholder');
            element.querySelectorAll('[aria-label="Preview control"]').length.should.be.greaterThan(0);
            element.dataset.invalid!.should.equal('true');
            placeholderOf(other)!.should.equal('Example placeholder');
            [other.dataset.invalid].should.deep.equal([undefined]);
            registeredComponentFor(element)!.props.should.deep.equal(original);
            valuesOf(element).should.deep.equal(originalValues);
            [element.querySelector<HTMLInputElement>('input')?.value].should.deep.equal([originalInputValue]);
            onChange.mock.calls.should.deep.equal([]);
            await act(async () => { revert(); revert(); });
            placeholderOf(element)!.should.equal('Example placeholder');
            element.querySelectorAll('[aria-label="Example control"]').length.should.be.greaterThan(0);
            [element.dataset.invalid].should.deep.equal([undefined]);
        });

        it('should not expose data, constraints, callbacks, or ReactNode props as presentation edits', () => {
            const forbidden = ['value', 'onChange', 'onBlur', 'options', 'label', 'renderOption', 'renderSelectedValue',
                'name', 'id', 'minDate', 'maxDate', 'showTime', 'hourFormat', 'required', 'disabled', 'readOnly', 'pt', 'style'];
            proposedChanges(describeComponentElement(element), Object.fromEntries(forbidden.map((name) => [name, 'Rejected']))).should.deep.equal([]);
        });

        it('should unregister both instances on unmount', async () => {
            await act(async () => screen.root.render(<></>));
            [registeredComponentFor(element), registeredComponentFor(other)].should.deep.equal([undefined, undefined]);
        });
    });
}

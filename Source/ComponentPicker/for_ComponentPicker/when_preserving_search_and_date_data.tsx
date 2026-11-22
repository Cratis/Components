// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { ComboBox } from '../../Common/ComboBox';
import { DatePickerInput } from '../../Common/DatePickerInput';
import { previewPresentationChanges, registeredComponentFor } from '../../configuration/identity/componentInstances';
import { mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const press = async (element: HTMLElement, key: string) => {
    await act(async () => {
        element.focus();
        element.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true }));
    });
};

describe('when preserving search and date data during presentation preview', () => {
    let screen: ScreenInTheDom;

    afterEach(async () => unmountScreen(screen));

    it('should keep combobox options, form identity, and keyboard selection owned by the original control', async () => {
        const selections: (string | null)[] = [];
        const options = [
            { key: 'example-one', label: 'First example', description: <strong>First details</strong> },
            { key: 'example-two', label: 'Second example', description: <strong>Second details</strong> },
        ];
        screen = await mountScreen(<ComboBox options={options} value='example-one' name='example-selection'
            onChange={(value) => selections.push(value)} aria-label='Example search' />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="ComboBox"]')!;
        const original = registeredComponentFor(element)!.props;
        await act(async () => {
            previewPresentationChanges(element, [
                { property: 'aria-label', from: 'Example search', to: 'Preview search' },
                { property: 'invalid', from: undefined, to: true },
            ]);
        });
        const input = element.querySelector<HTMLInputElement>('input[role="combobox"]')!;
        input.value.should.equal('First example');
        const submittedInput = element.querySelector<HTMLInputElement>('input[type="hidden"]')!;
        [submittedInput.name, submittedInput.value].should.deep.equal(['example-selection', 'example-one']);
        registeredComponentFor(element)!.props.should.deep.equal(original);
        selections.should.deep.equal([]);
        await press(input, 'ArrowDown');
        Array.from(document.querySelectorAll('[role="option"] strong')).map((description) => description.textContent)
            .should.deep.equal(['First details', 'Second details']);
        await press(input, 'ArrowDown');
        await press(input, 'Enter');
        selections.should.deep.equal(['example-two']);
    });

    it('should keep the selected date, bounds, and time settings while previewing and reverting presentation', async () => {
        const selections: (Date | null)[] = [];
        const selected = new Date(2026, 5, 10, 14, 30);
        const minDate = new Date(2026, 5, 9);
        const maxDate = new Date(2026, 5, 11);
        screen = await mountScreen(<DatePickerInput id='example-date' value={selected} minDate={minDate} maxDate={maxDate}
            showTime hourFormat='24' onChange={(value) => selections.push(value)} aria-label='Example date' />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="DatePickerInput"]')!;
        const original = registeredComponentFor(element)!.props;
        const segments = () => Array.from(element.querySelectorAll('[data-cratis-part="segment"]')).map((segment) => segment.textContent);
        const originalSegments = segments();
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [
                { property: 'aria-label', from: 'Example date', to: 'Preview date' },
                { property: 'invalid', from: undefined, to: true },
            ]);
        });
        segments().should.deep.equal(originalSegments);
        element.querySelectorAll('[data-type="hour"]').length.should.equal(1);
        element.querySelectorAll('[data-type="minute"]').length.should.equal(1);
        element.dataset.selected!.should.equal('true');
        registeredComponentFor(element)!.props.should.deep.equal(original);
        selections.should.deep.equal([]);
        await act(async () => revert());
        segments().should.deep.equal(originalSegments);
        await act(async () => element.querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!.click());
        document.querySelector('[data-cratis-part="cell"][data-selected]')!.textContent!.should.equal('10');
        selections.should.deep.equal([]);
    });
});

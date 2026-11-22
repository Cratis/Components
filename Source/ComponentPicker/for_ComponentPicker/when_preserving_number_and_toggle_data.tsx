// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { NumberInput } from '../../Common/NumberInput';
import { ToggleGroup } from '../../Common/ToggleGroup';
import { previewPresentationChanges, registeredComponentFor } from '../../configuration/identity/componentInstances';
import { describeComponentElement } from '../describeComponentElement';
import { proposedChanges } from '../proposedChanges';
import { click, mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const press = async (element: HTMLElement, key: string) => {
    await act(async () => {
        element.focus();
        element.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, bubbles: true }));
    });
};

const rejectDataChanges = async (element: HTMLElement, properties: readonly string[]) => {
    const original = registeredComponentFor(element)!;
    const names = original.descriptor.properties.map(({ name }) => name);
    properties.filter((property) => names.includes(property)).should.deep.equal([]);
    const changes = proposedChanges(describeComponentElement(element), Object.fromEntries(properties.map((property) => [property, 'Rejected'])));
    changes.should.deep.equal([]);
    let revert!: () => void;
    await act(async () => {
        revert = previewPresentationChanges(element, changes);
    });
    registeredComponentFor(element)!.props.should.deep.equal(original.props);
    await act(async () => revert());
};

describe('when preserving number and toggle data during presentation preview', () => {
    let screen: ScreenInTheDom;

    afterEach(async () => unmountScreen(screen));

    it('should exclude numeric data, formatting, callbacks and ReactNode props while preserving keyboard behavior', async () => {
        const changes: (number | null)[] = [];
        screen = await mountScreen(<NumberInput id='example-number' name='example-quantity' value={12} min={0} max={20} step={2}
            locale='en-US' aria-label='Example quantity' prefix={<strong>Example quantity</strong>} description={<em>Example hint</em>}
            onChange={(value) => changes.push(value)} />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="NumberInput"]')!;
        await rejectDataChanges(element, [
            'value', 'onChange', 'onCommit', 'min', 'max', 'step', 'locale', 'useGrouping', 'minimumFractionDigits',
            'maximumFractionDigits', 'prefix', 'suffix', 'description', 'errorMessage', 'name', 'id', 'pt', 'style', 'children',
        ]);
        await act(async () => {
            previewPresentationChanges(element, [{ property: 'placeholder', from: undefined, to: 'Preview number' }]);
        });
        const input = element.querySelector<HTMLInputElement>('input[data-cratis-part="input"]')!;
        const submittedInput = screen.container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
        input.value.should.equal('12');
        submittedInput.name.should.equal('example-quantity');
        submittedInput.value.should.equal('12');
        input.placeholder.should.equal('Preview number');
        element.dataset.cratisComponentId!.should.equal('example-number');
        element.querySelector('strong')!.textContent!.should.equal('Example quantity');
        element.querySelector('em')!.textContent!.should.equal('Example hint');
        changes.should.deep.equal([]);
        await press(input, 'ArrowUp');
        changes.should.deep.equal([14]);
    });

    it('should exclude options, selection, callbacks and ReactNode props without changing radio semantics', async () => {
        const changes: string[] = [];
        screen = await mountScreen(<ToggleGroup options={[
            { value: 'first', label: <strong>First example</strong> },
            { value: 'second', label: 'Second example', icon: <em>Example icon</em> },
        ]} value='first' onChange={(value) => changes.push(value)} aria-label='Example choices' />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="ToggleGroup"]')!;
        await rejectDataChanges(element, ['options', 'value', 'onChange', 'children', 'label', 'icon', 'pt', 'style']);
        await act(async () => {
            previewPresentationChanges(element, [
                { property: 'aria-label', from: 'Example choices', to: 'Preview choices' },
                { property: 'invalid', from: undefined, to: true },
            ]);
        });
        element.getAttribute('role')!.should.equal('radiogroup');
        element.getAttribute('aria-label')!.should.equal('Preview choices');
        const radios = element.querySelectorAll<HTMLElement>('[role="radio"]');
        Array.from(radios).map((radio) => [radio.getAttribute('aria-checked'), radio.tabIndex])
            .should.deep.equal([['true', 0], ['false', -1]]);
        element.querySelector('strong')!.textContent!.should.equal('First example');
        element.querySelector('em')!.textContent!.should.equal('Example icon');
        changes.should.deep.equal([]);
        await click(radios[1]);
        changes.should.deep.equal(['second']);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import { mountComboBox, pressComboBoxKey, type MountedComboBox } from './given/a_combobox';

should();

describe('when preserving ComboBox rendered parts', () => {
    let mounted: MountedComboBox;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
    });

    it('should keep control order, supporting text ids, option content, and pass-through attributes', async () => {
        mounted = await mountComboBox({
            id: 'example-picker', 'aria-label': 'Example Project',
            options: [{ key: 'example', label: 'Example Project', description: 'Synthetic description' }],
            initialValue: 'example', description: 'Choose an example', errorMessage: 'Example validation', invalid: true,
            'aria-describedby': 'external-description',
            pt: { input: { className: 'sample-input', 'data-sample': 'input' }, option: { 'data-sample': 'option' } },
        });
        mounted.field.getAttribute('data-cratis-component')!.should.equal('ComboBox');
        mounted.field.getAttribute('data-invalid')!.should.equal('true');
        mounted.input.id.should.equal('example-picker');
        mounted.input.classList.contains('sample-input').should.equal(true);
        mounted.input.getAttribute('data-sample')!.should.equal('input');
        const control = mounted.field.querySelector('.cratis-combobox__control')!;
        Array.from(control.children).map(child => child.tagName).should.deep.equal(['INPUT', 'BUTTON']);
        const description = mounted.field.querySelector('[data-cratis-part="description"]')!;
        const error = mounted.field.querySelector('[data-cratis-part="error"]')!;
        description.textContent!.should.equal('Choose an example');
        error.textContent!.should.equal('Example validation');
        mounted.input.getAttribute('aria-describedby')!.should.equal(`external-description ${description.id} ${error.id}`);
        await pressComboBoxKey(mounted, 'ArrowDown');
        const option = document.querySelector('[data-cratis-part="option"]')!;
        option.getAttribute('data-sample')!.should.equal('option');
        Array.from(option.children).map(child => child.getAttribute('data-cratis-part')).should.deep.equal([
            'optionLabel', 'optionDescription',
        ]);
        option.textContent!.should.equal('Example ProjectSynthetic description');
        mounted.input.getAttribute('aria-controls')!.should.equal(document.querySelector('[role="listbox"]')!.id);
    });

    it('should prefer loading over failure and retain disabled readonly root states', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Example Project', options: [], loading: true, failure: 'Example failure',
            disabled: true, readOnly: true,
        });
        mounted.field.getAttribute('data-disabled')!.should.equal('true');
        mounted.field.getAttribute('data-readonly')!.should.equal('true');
        mounted.field.getAttribute('data-loading')!.should.equal('true');
        mounted.input.disabled.should.equal(true);
        mounted.input.readOnly.should.equal(true);
        mounted.trigger.disabled.should.equal(true);
    });
});

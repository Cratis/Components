// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import { mountComboBox, pressComboBoxKey, typeIntoComboBox, type MountedComboBox } from './given/a_combobox';

should();

describe('when preserving ComboBox callback order', () => {
    let mounted: MountedComboBox;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
    });

    it('should notify typed text before selection and notify selection before its label', async () => {
        const events: string[] = [];
        mounted = await mountComboBox({
            'aria-label': 'Example Project', options: [{ key: 'example', label: 'Example Project' }],
            onInputChange: text => events.push(`input:${text}`),
            onChange: value => events.push(`selection:${value}`),
        });
        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'Exam');
        events.should.deep.equal(['input:Exam']);
        events.length = 0;
        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'Enter');
        events.should.deep.equal(['selection:example', 'input:Example Project']);
    });

    it('should run an action with current text without changing selection or the input label', async () => {
        const events: string[] = [];
        mounted = await mountComboBox({
            'aria-label': 'Example Project', options: [],
            onInputChange: text => events.push(`input:${text}`),
            onChange: value => events.push(`selection:${value}`),
            action: { label: 'Create Example', onAction: text => events.push(`action:${text}`) },
        });
        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'New Example');
        events.length = 0;
        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'Enter');
        events.should.deep.equal(['action:New Example']);
        mounted.input.value.should.equal('New Example');
    });
});

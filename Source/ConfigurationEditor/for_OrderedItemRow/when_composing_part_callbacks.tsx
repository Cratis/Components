// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { OrderedItemRow } from '../OrderedItemRow';
import type { OrderedItemRowProps } from '../OrderedItemRowProps';
import { defaultOrderedItemLabels } from '../defaultOrderedItemLabels';
import { allowEverything } from '../for_OrderedItemEditor/given';
import { Mount } from '../for_OrderedItemEditor/Mount';

should();

describe('when composing ordered row part callbacks', () => {
    const mount = new Mount();
    let calls: string[];
    let props: OrderedItemRowProps<{ id: string; label: string }>;

    beforeEach(() => {
        mount.setup();
        calls = [];
        props = {
            item: { id: 'sample/item', label: 'Sample item' }, index: 0, count: 2, locked: false,
            capabilities: allowEverything, labels: defaultOrderedItemLabels, destinations: [],
            validation: { label: 'Label message', item: 'Item message' }, baseId: 'sample',
            parts: undefined, dragging: false, dropPosition: undefined,
            onField: () => { calls.push('field'); }, onFieldBlur: () => { calls.push('leave'); },
            onMove: (_item, delta, control) => { calls.push(`${control}:${delta}`); },
            onRemove: () => {}, onDragStart: () => {}, onDragOver: () => {}, onDrop: () => {}, onDragEnd: () => {},
        };
    });
    afterEach(() => mount.teardown());

    const render = () => mount.render(<ul><OrderedItemRow {...props} /></ul>);
    const label = () => mount.control<HTMLInputElement>('sample/item', 'label');

    it('should let the handle part cancel a keyboard move before the row acts', async () => {
        props.parts = { handle: { onKeyDown: (event) => { calls.push('part'); event.preventDefault(); } } };
        await render();

        await mount.key(mount.control('sample/item', 'handle'), 'ArrowDown');

        calls.should.deep.equal(['part']);
    });

    it('should invoke the handle part before proposing a keyboard move', async () => {
        props.parts = { handle: { onKeyDown: () => { calls.push('part'); } } };
        await render();

        await mount.key(mount.control('sample/item', 'handle'), 'ArrowUp');

        calls.should.deep.equal(['part', 'handle:-1']);
    });

    it('should leave an Escape draft after the label part even if that part prevented default', async () => {
        props.parts = { label: { onKeyDown: (event) => { calls.push('part'); event.preventDefault(); } } };
        await render();
        await mount.type(label(), 'Draft');

        await mount.key(label(), 'Escape');

        calls.should.deep.equal(['field', 'part', 'leave']);
        label().value.should.equal('Sample item');
    });

    it('should invoke the blur part before leaving the draft', async () => {
        props.parts = { label: { onBlur: () => { calls.push('part'); } } };
        await render();
        await mount.type(label(), 'Draft');

        await act(async () => { label().focus(); label().blur(); });

        calls.should.deep.equal(['field', 'part', 'leave']);
        label().value.should.equal('Sample item');
    });

    it('should associate both messages with the sanitized row identity', async () => {
        await render();

        mount.row('sample/item').id.should.equal('sample-sample_item');
        label().getAttribute('aria-describedby')!.should.equal('sample-sample_item-label-message sample-sample_item-item-message');
        mount.parts('message').map((element) => element.id).should.deep.equal([
            'sample-sample_item-label-message', 'sample-sample_item-item-message',
        ]);
    });
});

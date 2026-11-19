// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPage, renderPage, renderSlotTable } from './generate-slot-contracts.mjs';

const profile = (overrides = {}) => ({
    slotId: 'example.slot',
    propsType: 'ExampleProps',
    ownership: { core: ['Keeps the state'], adapter: ['Renders the control'] },
    ptKeys: ['root', 'label'],
    nativeSelector: 'button',
    nativeTag: 'BUTTON',
    refCapable: false,
    ...overrides,
});
const snippets = new Map([['example.slot', 'export const example = 1;\n']]);

test('renders props, root, parts, ref, ownership and the snippet for each slot in order', () => {
    const page = renderPage([profile()], snippets, ['example.slot']);
    for (const expected of [
        '## `example.slot`',
        '| Props | `ExampleProps` |',
        '| Root element | `<button>` matching `button` |',
        '| Parts | `root`, `label` |',
        '| Ref | None; the slot does not forward a ref |',
        '- Keeps the state',
        '- Renders the control',
        'export const example = 1;',
    ]) {
        assert.ok(page.includes(expected), `missing: ${expected}`);
    }
});

test('names the platform root and the parts it owns', () => {
    const table = renderSlotTable(
        profile({ platformRoot: { selector: 'dialog', tag: 'DIALOG', ownedParts: ['backdrop', 'positioner'] } }),
    );
    assert.ok(table.includes('platform `<dialog>`'));
    assert.ok(table.includes('`backdrop` and `positioner`'));
});

test('rejects a stable slot that has no profile, contract text or snippet', () => {
    assert.throws(() => renderPage([], snippets, ['example.slot']), /no profile/);
    assert.throws(
        () => renderPage([profile({ ownership: undefined })], snippets, ['example.slot']),
        /ownership/,
    );
    assert.throws(() => renderPage([profile()], new Map(), ['example.slot']), /no snippet/);
});

test('check passes on fresh output and fails on an edited page or a changed part', () => {
    const fresh = renderPage([profile()], snippets, ['example.slot']);
    assert.equal(checkPage(fresh, renderPage([profile()], snippets, ['example.slot'])), true);
    assert.equal(checkPage(`${fresh}\nhand edit`, fresh), false);
    const changed = renderPage([profile({ ptKeys: ['root', 'caption'] })], snippets, ['example.slot']);
    assert.equal(checkPage(fresh, changed), false);
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { ActionMenubar, type ActionMenuItem } from '../ActionMenubar';
import { ToolbarFocusMode } from '../ToolbarFocusMode';

let container: HTMLDivElement;
let root: Root;
const render = async (model: ActionMenuItem[], pt?: React.ComponentProps<typeof ActionMenubar>['pt']) => {
    await act(async () => root.render(<ActionMenubar focusMode={ToolbarFocusMode.SingleTabStop} aria-label='Actions' model={model} pt={pt} />));
    await act(async () => { await Promise.resolve(); });
};
const action = (label: string) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.includes(label))!;
const tabIndexes = (...labels: string[]) => labels.map(label => action(label).getAttribute('tabindex'));

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when an action menubar uses a single Tab stop', () => {
    it('should move the Tab stop to a focused action and call the consumer focus handler once', async () => {
        let focused = 0;
        await render([{ label: 'Save' }, { label: 'Share' }], { root: { onFocus: () => { focused++; } } });
        expect(tabIndexes('Save', 'Share')).to.deep.equal(['0', '-1']);
        await act(async () => action('Share').focus());
        expect(focused).to.equal(1);
        expect(tabIndexes('Save', 'Share')).to.deep.equal(['-1', '0']);
    });

    it('should give every action its explicit tab index and no single Tab stop', async () => {
        await render([{ label: 'Save' }, { label: 'Share' }], { root: { tabIndex: 0 } });
        expect(tabIndexes('Save', 'Share')).to.deep.equal(['0', '0']);
    });

    it('should skip a disabled first action', async () => {
        await render([{ label: 'Save', disabled: true }, { label: 'Share' }, { label: 'Delete' }]);
        expect(tabIndexes('Share', 'Delete')).to.deep.equal(['0', '-1']);
    });

    it('should leave the tab index of template content alone', async () => {
        await render([{ label: 'Save' }, { label: 'Search', template: () => <input aria-label='Search' /> }]);
        expect(container.querySelector('input')!.hasAttribute('tabindex')).to.equal(false);
        expect(tabIndexes('Save')).to.deep.equal(['0']);
    });
});

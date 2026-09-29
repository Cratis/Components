// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { Toolbar } from '../Toolbar';
import { ToolbarButton } from '../ToolbarButton';
import { ActionMenubar } from '../../Common/ActionMenubar';
import { ToolbarFocusMode } from '../../Common/ToolbarFocusMode';

const key = async (target: Element, name: string) => {
    await act(async () => {
        target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    });
};

let container: HTMLDivElement;
let root: Root;
const toolButtons = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button.toolbar-button'));
const tabIndexes = () => toolButtons().map(button => button.getAttribute('tabindex'));
const render = async (element: React.ReactNode) => {
    await act(async () => root.render(element));
};

let disableFirst: (disabled: boolean) => void = () => undefined;
const Tools = ({ focusMode = ToolbarFocusMode.SingleTabStop }: { focusMode?: ToolbarFocusMode }) => {
    const [firstDisabled, setFirstDisabled] = useState(false);
    disableFirst = setFirstDisabled;
    return (
        <>
            <button type='button'>Before</button>
            <Toolbar focusMode={focusMode} orientation='horizontal'>
                <ToolbarButton icon='pi pi-pencil' title='Draw' pt={{ root: { disabled: firstDisabled } }} />
                <ToolbarButton icon='pi pi-eraser' title='Erase' />
                <input aria-label='Size' />
                <ToolbarButton icon='pi pi-undo' title='Undo' />
                <ToolbarButton icon='pi pi-lock' title='Locked' pt={{ root: { tabIndex: -1 } }} />
            </Toolbar>
            <button type='button'>After</button>
        </>
    );
};

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

describe('when a toolbar uses a single Tab stop', () => {
    it('should give only the first of its own tools a Tab stop and keep consumer tab indexes', async () => {
        await render(<Tools />);
        expect(tabIndexes()).to.deep.equal(['0', '-1', '-1', '-1']);
    });

    it('should enter at the active tool, skip its other tools, and keep the input a separate Tab stop', async () => {
        await render(<Tools />);
        const user = userEvent.setup();
        container.querySelector<HTMLButtonElement>('button')!.focus();
        await user.tab();
        expect(document.activeElement?.getAttribute('aria-label')).to.equal('Draw');
        await user.tab();
        expect(document.activeElement?.getAttribute('aria-label')).to.equal('Size');
        await user.tab();
        expect(document.activeElement?.textContent).to.equal('After');
    });

    it('should move the Tab stop with arrow keys and return to the last focused tool', async () => {
        await render(<Tools />);
        const [draw] = toolButtons();
        draw.focus();
        await key(draw, 'ArrowRight');
        expect(document.activeElement?.getAttribute('aria-label')).to.equal('Erase');
        expect(tabIndexes()).to.deep.equal(['-1', '0', '-1', '-1']);
        const user = userEvent.setup();
        container.querySelector<HTMLButtonElement>('button')!.focus();
        await user.tab();
        expect(document.activeElement?.getAttribute('aria-label')).to.equal('Erase');
    });

    it('should move the Tab stop to the next available tool when the active tool becomes unavailable', async () => {
        await render(<Tools />);
        await act(async () => disableFirst(true));
        expect(tabIndexes()).to.deep.equal(['-1', '0', '-1', '-1']);
    });

    // The tooltip trigger gives each tool tabindex=0 in the default mode, as before this change.
    it('should render the default tab indexes in the default mode', async () => {
        await render(<Tools focusMode={ToolbarFocusMode.Arrows} />);
        expect(tabIndexes()).to.deep.equal(['0', '0', '0', '-1']);
    });

    it('should restore the default tab indexes when switching back to the default mode', async () => {
        await render(<Tools />);
        await render(<Tools focusMode={ToolbarFocusMode.Arrows} />);
        expect(tabIndexes()).to.deep.equal(['0', '0', '0', '-1']);
    });
});

describe('when an action menubar uses a single Tab stop', () => {
    it('should give only its first action a Tab stop and move it with arrow keys', async () => {
        await render(
            <ActionMenubar
                focusMode={ToolbarFocusMode.SingleTabStop}
                aria-label='Actions'
                model={[{ label: 'Save' }, { label: 'Share' }, { label: 'Delete' }]}
            />,
        );
        const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
        expect(actions().map(action => action.getAttribute('tabindex'))).to.deep.equal(['0', '-1', '-1']);
        actions()[0].focus();
        await key(actions()[0], 'End');
        expect(document.activeElement?.textContent).to.contain('Delete');
        expect(actions().map(action => action.getAttribute('tabindex'))).to.deep.equal(['-1', '-1', '0']);
    });
});

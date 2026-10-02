// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Harness, allowEverything } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

const dragEvent = (type: string, init: { clientY?: number; dataTransfer?: Partial<DataTransfer> }) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: init.dataTransfer ?? { setData: () => undefined, types: [] } });
    Object.defineProperty(event, 'clientY', { value: init.clientY ?? 0 });
    return event;
};

const threeItems = () => [
    { id: 'page-a', label: 'Page A' },
    { id: 'page-b', label: 'Page B' },
    { id: 'page-c', label: 'Page C' },
];

describe('when reordering configurable items', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    describe('with the move buttons', () => {
        it('should propose moving the item down with the resulting order', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);

            await mount.click(mount.control('page-a', 'moveDown'));

            const proposal = proposals[0];
            expect(proposal.kind).to.equal('move');
            if (proposal.kind !== 'move') return;
            expect([proposal.fromIndex, proposal.toIndex]).to.deep.equal([0, 1]);
            expect(proposal.items.map((item) => item.id)).to.deep.equal(['page-b', 'page-a', 'page-c']);
            expect(mount.order()).to.deep.equal(['page-b', 'page-a', 'page-c']);
        });

        it('should propose moving the item up', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);

            await mount.click(mount.control('page-c', 'moveUp'));

            expect(mount.order()).to.deep.equal(['page-a', 'page-c', 'page-b']);
        });

        it('should return focus to the control of the item that moved', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);
            const down = mount.control('page-a', 'moveDown');
            down.focus();

            await mount.click(down);

            expect(document.activeElement).to.equal(mount.control('page-a', 'moveDown'));
        });

        it('should announce the new position in a status region', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            await mount.click(mount.control('page-a', 'moveDown'));

            const status = mount.parts('status')[0];
            expect(status.getAttribute('role')).to.equal('status');
            expect(status.textContent).to.equal('Page A moved to position 2 of 3.');
        });

        it('should keep focus on a move button that reaches the edge by marking it unavailable instead of disabling it', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            expect(mount.control('page-a', 'moveUp').getAttribute('aria-disabled')).to.equal('true');
            expect(mount.control('page-a', 'moveUp').hasAttribute('disabled')).to.equal(false);
            expect(mount.control('page-c', 'moveDown').getAttribute('aria-disabled')).to.equal('true');
        });

        it('should not propose anything for the first item moving up', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);

            await mount.click(mount.control('page-a', 'moveUp'));

            expect(proposals).to.have.length(0);
        });

        it('should not move the item when the host cancels the proposal', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} apply={false} />);

            await mount.click(mount.control('page-a', 'moveDown'));

            expect(mount.order()).to.deep.equal(['page-a', 'page-b', 'page-c']);
        });

        it('should not steal focus later when the host cancelled the move', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} apply={false} />);
            await mount.click(mount.control('page-a', 'moveDown'));
            const input = mount.control<HTMLInputElement>('page-b', 'label');
            input.focus();

            await mount.type(input, '');

            expect(document.activeElement).to.equal(input);
        });
    });

    describe('with the keyboard', () => {
        it('should move an item down with the arrow-down key on its handle', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);
            const handle = mount.control('page-a', 'handle');
            handle.focus();

            await mount.key(handle, 'ArrowDown');

            expect(mount.order()).to.deep.equal(['page-b', 'page-a', 'page-c']);
            expect(document.activeElement).to.equal(mount.control('page-a', 'handle'));
        });

        it('should move an item up with the arrow-up key on its handle and keep moving', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);
            mount.control('page-c', 'handle').focus();

            await mount.key(mount.control('page-c', 'handle'), 'ArrowUp');
            await mount.key(mount.control('page-c', 'handle'), 'ArrowUp');

            expect(mount.order()).to.deep.equal(['page-c', 'page-a', 'page-b']);
            expect(document.activeElement).to.equal(mount.control('page-c', 'handle'));
        });

        it('should describe the handle shortcut', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            expect(mount.control('page-a', 'handle').getAttribute('aria-keyshortcuts')).to.equal('ArrowUp ArrowDown');
        });
    });

    describe('with the pointer', () => {
        const dragOnto = async (sourceId: string, targetId: string, clientY: number) => {
            const stored: Record<string, string> = {};
            const dataTransfer = { setData: (type: string, value: string) => { stored[type] = value; }, effectAllowed: 'none', dropEffect: 'none', types: [] } as unknown as DataTransfer;
            const handle = mount.control(sourceId, 'handle');
            const target = mount.row(targetId);
            target.getBoundingClientRect = () => ({ top: 0, height: 100, bottom: 100, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON: () => ({}) });
            await act(async () => { handle.dispatchEvent(dragEvent('dragstart', { dataTransfer })); });
            await act(async () => { target.dispatchEvent(dragEvent('dragover', { dataTransfer, clientY })); });
            return { dataTransfer, target, handle, stored };
        };

        it('should make the handle draggable', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            expect(mount.control<HTMLButtonElement>('page-a', 'handle').draggable).to.equal(true);
        });

        it('should mark the drop position while dragging over the leading or trailing half', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            const { target } = await dragOnto('page-a', 'page-c', 80);
            expect(target.getAttribute('data-drop-position')).to.equal('after');
            expect(mount.row('page-a').hasAttribute('data-dragging')).to.equal(true);

            await act(async () => { target.dispatchEvent(dragEvent('dragover', { clientY: 10 })); });
            expect(target.getAttribute('data-drop-position')).to.equal('before');
        });

        it('should propose the move when dropped after the target', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);
            const { target, dataTransfer } = await dragOnto('page-a', 'page-c', 80);

            await act(async () => { target.dispatchEvent(dragEvent('drop', { dataTransfer, clientY: 80 })); });

            expect(mount.order()).to.deep.equal(['page-b', 'page-c', 'page-a']);
            expect(proposals).to.have.length(1);
        });

        it('should propose the move when dropped before the target', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);
            const { target, dataTransfer } = await dragOnto('page-c', 'page-a', 10);

            await act(async () => { target.dispatchEvent(dragEvent('drop', { dataTransfer, clientY: 10 })); });

            expect(mount.order()).to.deep.equal(['page-c', 'page-a', 'page-b']);
        });

        it('should propose nothing when an item is dropped where it already is', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);
            const { target, dataTransfer } = await dragOnto('page-b', 'page-b', 10);

            await act(async () => { target.dispatchEvent(dragEvent('drop', { dataTransfer, clientY: 10 })); });

            expect(proposals).to.have.length(0);
        });

        it('should clear the drag state when the drag is cancelled', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);
            const { handle, target } = await dragOnto('page-a', 'page-c', 80);

            await act(async () => { handle.dispatchEvent(dragEvent('dragend', {})); });

            expect(mount.row('page-a').hasAttribute('data-dragging')).to.equal(false);
            expect(target.hasAttribute('data-drop-position')).to.equal(false);
            expect(mount.order()).to.deep.equal(['page-a', 'page-b', 'page-c']);
        });

        it('should ignore a drag that did not start on a handle', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} />);
            const target = mount.row('page-b');

            await act(async () => { target.dispatchEvent(dragEvent('drop', { clientY: 10 })); });

            expect(proposals).to.have.length(0);
        });
    });

    describe('when reordering is not allowed', () => {
        it('should offer no handle and no move button, and never propose a move', async () => {
            const proposals: OrderedItemProposal[] = [];
            await mount.render(<Harness proposals={proposals} initial={threeItems()} capabilities={{ ...allowEverything, reorder: false }} />);

            expect(mount.parts('handle')).to.have.length(0);
            expect(mount.parts('moveUp')).to.have.length(0);
            expect(mount.parts('moveDown')).to.have.length(0);

            const target = mount.row('page-b');
            await act(async () => { target.dispatchEvent(dragEvent('drop', { clientY: 10 })); });
            expect(proposals).to.have.length(0);
        });

        it('should never offer a handle on a fixed item', async () => {
            await mount.render(<Harness proposals={[]} initial={threeItems()} />);

            expect(mount.row('home').querySelector('[data-control="handle"]')).to.equal(null);
        });
    });
});

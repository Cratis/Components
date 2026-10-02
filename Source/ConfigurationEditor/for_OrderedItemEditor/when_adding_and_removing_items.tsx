// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { OrderedItemEditor } from '../OrderedItemEditor';
import { Harness, allowEverything, pageItems } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

describe('when adding and removing configurable items', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    const addButton = () => mount.container.querySelector<HTMLButtonElement>('[data-control="add"]')!;

    it('should propose the item the host creates at the end of the collection', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.click(addButton());

        const proposal = proposals[0];
        expect(proposal.kind).to.equal('add');
        if (proposal.kind !== 'add') return;
        expect(proposal.index).to.equal(2);
        expect(proposal.item.id).to.match(/^new-/u);
        expect(proposal.items).to.have.length(3);
        expect(mount.order()).to.have.length(3);
    });

    it('should move focus to the label of the new item', async () => {
        await mount.render(<Harness proposals={[]} />);

        await mount.click(addButton());

        const created = mount.order()[2]!;
        expect(document.activeElement).to.equal(mount.control(created, 'label'));
    });

    it('should propose removing the item and move focus to the item that takes its place', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.click(mount.control('page-a', 'remove'));

        const proposal = proposals[0];
        expect(proposal.kind).to.equal('remove');
        if (proposal.kind !== 'remove') return;
        expect(proposal.item.id).to.equal('page-a');
        expect(proposal.index).to.equal(0);
        expect(proposal.items.map((item) => item.id)).to.deep.equal(['page-b']);
        expect(document.activeElement).to.equal(mount.control('page-b', 'remove'));
    });

    it('should move focus to the previous item when the last one is removed', async () => {
        await mount.render(<Harness proposals={[]} />);

        await mount.click(mount.control('page-b', 'remove'));

        expect(document.activeElement).to.equal(mount.control('page-a', 'remove'));
    });

    it('should move focus to the add action when the last remaining item is removed', async () => {
        await mount.render(<Harness proposals={[]} initial={[pageItems()[0]]} />);

        await mount.click(mount.control('page-a', 'remove'));

        expect(document.activeElement).to.equal(addButton());
        expect(mount.parts('empty')).to.have.length(1);
    });

    it('should not offer remove or add when the host forbids them and never propose them', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} capabilities={{ ...allowEverything, add: false, remove: false }} />);

        expect(mount.parts('remove')).to.have.length(0);
        expect(mount.parts('add')).to.have.length(0);
        expect(proposals).to.have.length(0);
    });

    it('should not offer adding without a way to create an item', async () => {
        await mount.render(<OrderedItemEditor items={pageItems()} capabilities={allowEverything} onChange={() => undefined} />);

        expect(mount.parts('add')).to.have.length(0);
    });

    it('should make adding unavailable at the maximum and say why', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} capabilities={{ ...allowEverything, maxItems: 2 }} />);

        expect(addButton().getAttribute('aria-disabled')).to.equal('true');
        expect(mount.parts('message').map((message) => message.textContent)).to.include('The maximum number of items has been reached.');

        await mount.click(addButton());
        expect(proposals).to.have.length(0);
    });

    it('should never touch the fixed items', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);
        await mount.click(mount.control('page-a', 'remove'));
        await mount.click(mount.control('page-b', 'moveUp'));

        for (const proposal of proposals) {
            expect(proposal.items.some((item) => item.id === 'home')).to.equal(false);
        }
    });
});

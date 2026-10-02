// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Harness, allowEverything, restricted } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

describe('when editing the fields of a configurable item', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    it('should propose an update carrying the item as it would be and the resulting collection', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.type(mount.control<HTMLInputElement>('page-a', 'label'), 'Overview page');

        expect(proposals).to.have.length(1);
        const proposal = proposals[0];
        expect(proposal.kind).to.equal('update');
        if (proposal.kind !== 'update') return;
        expect(proposal.field).to.equal('label');
        expect(proposal.item).to.deep.equal({ ...proposal.previous, label: 'Overview page' });
        expect(proposal.previous.label).to.equal('Page A');
        expect(proposal.items.map((item) => item.label)).to.deep.equal(['Overview page', 'Page B']);
    });

    it('should carry host properties of the item through the proposal unchanged', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness proposals={proposals} initial={[{ id: 'page-a', label: 'Page A', route: '/a' } as never]} />,
        );

        await mount.type(mount.control<HTMLInputElement>('page-a', 'label'), 'Renamed');

        expect((proposals[0].items[0] as unknown as { route: string }).route).to.equal('/a');
    });

    it('should not propose a blank label and should say why', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);
        const input = mount.control<HTMLInputElement>('page-a', 'label');

        await mount.type(input, '   ');

        expect(proposals).to.have.length(0);
        expect(input.getAttribute('aria-invalid')).to.equal('true');
        const message = document.getElementById(input.getAttribute('aria-describedby')!)!;
        expect(message.textContent).to.equal('Enter a label.');
        expect(message.getAttribute('role')).to.equal('alert');
    });

    it('should keep the typed text while it is invalid and restore the value on blur', async () => {
        await mount.render(<Harness proposals={[]} />);
        const input = mount.control<HTMLInputElement>('page-a', 'label');

        await mount.type(input, '');
        expect(input.value).to.equal('');
        await act(async () => { input.focus(); input.blur(); });

        expect(input.value).to.equal('Page A');
        expect(input.hasAttribute('aria-invalid')).to.equal(false);
    });

    it('should cancel an invalid entry with Escape', async () => {
        await mount.render(<Harness proposals={[]} />);
        const input = mount.control<HTMLInputElement>('page-a', 'label');
        await mount.type(input, '');

        await mount.key(input, 'Escape');

        expect(input.value).to.equal('Page A');
        expect(input.hasAttribute('aria-invalid')).to.equal(false);
    });

    it('should clear the message once a valid label is proposed', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);
        const input = mount.control<HTMLInputElement>('page-a', 'label');
        await mount.type(input, '');

        await mount.type(input, 'Fixed it');

        expect(proposals).to.have.length(1);
        expect(input.hasAttribute('aria-invalid')).to.equal(false);
    });

    it('should block a proposal the host rules reject and show their message', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                validate={(item, items) =>
                    items.filter((other) => other.label === item.label).length > 1 ? { label: 'Labels must be unique.' } : undefined
                }
            />,
        );

        await mount.type(mount.control<HTMLInputElement>('page-a', 'label'), 'Page B');

        expect(proposals).to.have.length(0);
        expect(mount.parts('message')[0].textContent).to.equal('Labels must be unique.');
    });

    it('should show validation feedback the host supplies for an item', async () => {
        await mount.render(<Harness proposals={[]} validation={{ 'page-b': { destination: 'Destination is not reachable.' } }} />);

        const select = mount.control<HTMLSelectElement>('page-b', 'destination');
        expect(select.getAttribute('aria-invalid')).to.equal('true');
        expect(document.getElementById(select.getAttribute('aria-describedby')!)!.textContent).to.equal('Destination is not reachable.');
    });

    it('should propose the destination id the person chose', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.select(mount.control<HTMLSelectElement>('page-a', 'destination'), 'settings');

        const proposal = proposals[0];
        expect(proposal.kind === 'update' && proposal.field).to.equal('destination');
        expect(proposal.kind === 'update' && proposal.item.destination).to.equal('settings');
    });

    it('should propose removing the destination when none is chosen', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.select(mount.control<HTMLSelectElement>('page-a', 'destination'), '');

        const proposal = proposals[0];
        expect(proposal.kind === 'update' && 'destination' in proposal.item).to.equal(false);
    });

    it('should propose the qualified icon reference the host chooser reports', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        await mount.click(mount.control('page-a', 'icon').querySelector('button')!);

        const proposal = proposals[0];
        expect(proposal.kind === 'update' && proposal.field).to.equal('icon');
        expect(proposal.kind === 'update' && proposal.item.icon).to.deep.equal({ library: 'example-icons', key: 'star' });
    });

    it('should not propose an icon equal to the current one', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness proposals={proposals} initial={[{ id: 'page-a', label: 'Page A', icon: { library: 'example-icons', key: 'star' } }]} />,
        );

        await mount.click(mount.control('page-a', 'icon').querySelector('button')!);

        expect(proposals).to.have.length(0);
    });

    it('should hand the host chooser a read-only flag and a name that includes the item', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(mount.control('page-a', 'icon').querySelector('button')!.getAttribute('aria-label')).to.equal('Icon: Page A');
    });

    it('should leave the shown value to the host: a cancelled proposal changes nothing', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} apply={false} />);
        const input = mount.control<HTMLInputElement>('page-a', 'label');

        await mount.type(input, 'Rejected');
        await act(async () => { input.focus(); input.blur(); });

        expect(proposals).to.have.length(1);
        expect(input.value).to.equal('Page A');
    });

    it('should not offer an icon chooser that can change when the icon is read-only', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} capabilities={restricted} />);

        expect(mount.control('page-a', 'icon').querySelector('button')).to.equal(null);
        expect(proposals).to.have.length(0);
    });

    it('should never propose a field change when the field is read-only, even from a chooser that ignores read-only', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                capabilities={{ ...allowEverything, fields: { label: 'editable', icon: 'readonly' } }}
                renderIconField={({ onChange }) => (
                    <button type='button' data-testid='rogue' onClick={() => onChange({ library: 'example-icons', key: 'rogue' })}>Rogue</button>
                )}
            />,
        );

        await mount.click(mount.container.querySelector<HTMLElement>('[data-testid="rogue"]')!);

        expect(proposals).to.have.length(0);
    });

    it('should never propose a change to a field the host does not expose', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                capabilities={{ ...allowEverything, fields: { label: 'editable' } }}
                renderIconField={({ onChange }) => (
                    <button type='button' data-testid='rogue' onClick={() => onChange({ library: 'x', key: 'y' })}>Rogue</button>
                )}
            />,
        );

        expect(mount.container.querySelector('[data-testid="rogue"]')).to.equal(null);
    });
});

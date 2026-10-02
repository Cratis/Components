// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { click, dialog, settle, tileNamed } from '../../IconPicker/for_IconPicker/given/a_picker_in_the_dom';
import { Harness, allowEverything, restricted } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

describe('when choosing icons with the icon picker', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(async () => {
        await mount.teardown();
        document.body.querySelectorAll('[data-cratis-part="popover"]').forEach((element) => element.remove());
    });

    const trigger = (id: string) => mount.control(id, 'icon').querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!;
    const openPicker = async (id: string) => {
        trigger(id).focus();
        await click(trigger(id));
        await settle();
    };

    it('should render the icon picker, not a separate icon grid, when the host supplies a catalog', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(trigger('page-a')).not.to.equal(undefined);
        expect(mount.control('page-a', 'icon').querySelector('[data-cratis-part="root"]')).not.to.equal(null);
        expect(mount.container.querySelector('[data-cratis-part="grid"]')).to.equal(null);
    });

    it('should name the picker after the item it belongs to', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(trigger('page-a').getAttribute('aria-label')).to.contain('Icon: Page A');
    });

    it('should propose an update carrying the qualified icon identity the person picked', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);
        await openPicker('page-a');

        await click(tileNamed('Arrow right')!);
        await settle();

        expect(proposals).to.have.length(1);
        const proposal = proposals[0];
        expect(proposal.kind).to.equal('update');
        if (proposal.kind !== 'update') return;
        expect(proposal.field).to.equal('icon');
        expect(proposal.item.icon).to.deep.equal({ library: 'example-glyphs', key: 'arrow-right' });
        expect(proposal.previous.icon).to.deep.equal({ library: 'example-glyphs', key: 'map' });
    });

    it('should keep two libraries that share an icon name distinct', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);
        await openPicker('page-a');

        await click(tileNamed('Home', 'Sample Symbols')!);
        await settle();

        const proposal = proposals[0];
        expect(proposal.kind === 'update' && proposal.item.icon).to.deep.equal({ library: 'sample-symbols', key: 'home' });
    });

    it('should show the picked icon once the host applies the proposal', async () => {
        await mount.render(<Harness proposals={[]} />);
        await openPicker('page-a');

        await click(tileNamed('Arrow right')!);
        await settle();

        expect(trigger('page-a').textContent).to.contain('Arrow right');
        expect(dialog()).to.equal(null);
    });

    it('should return focus to the picker trigger after a pick', async () => {
        await mount.render(<Harness proposals={[]} />);
        await openPicker('page-a');

        await click(tileNamed('Arrow right')!);
        await settle();

        expect(document.activeElement).to.equal(trigger('page-a'));
    });

    it('should leave the shown icon alone when the host cancels the proposal', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} apply={false} />);
        await openPicker('page-a');

        await click(tileNamed('Arrow right')!);
        await settle();

        expect(proposals).to.have.length(1);
        expect(trigger('page-a').textContent).to.contain('Map');
    });

    it('should not open the picker or emit when the icon field is read-only', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} capabilities={restricted} />);

        await openPicker('page-a');

        expect(dialog()).to.equal(null);
        expect(proposals).to.have.length(0);
    });

    it('should not offer an icon field for a locked fixed item', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} />);

        const home = mount.control('home', 'icon').querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!;
        home.focus();
        await click(home);
        await settle();

        expect(dialog()).to.equal(null);
        expect(proposals).to.have.length(0);
    });

    it('should list icons outside the allowed set but never emit them', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                allowedIcons={[{ library: 'example-glyphs', key: 'map' }, { library: 'example-glyphs', key: 'home' }]}
            />,
        );
        await openPicker('page-a');

        const blocked = tileNamed('Arrow right')!;
        expect(blocked.getAttribute('aria-disabled')).to.equal('true');
        await click(blocked);
        await settle();

        expect(proposals).to.have.length(0);
    });

    it('should emit an allowed icon', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                allowedIcons={[{ library: 'example-glyphs', key: 'map' }, { library: 'example-glyphs', key: 'home' }]}
            />,
        );
        await openPicker('page-a');

        await click(tileNamed('Home', 'Example Glyphs')!);
        await settle();

        expect(proposals).to.have.length(1);
    });

    it('should refuse an icon outside the allowed set even from an overriding chooser', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(
            <Harness
                proposals={proposals}
                allowedIcons={[{ library: 'example-glyphs', key: 'map' }]}
                renderIconField={({ onChange }) => (
                    <button type='button' data-testid='rogue' onClick={() => onChange({ library: 'example-glyphs', key: 'arrow-right' })}>Rogue</button>
                )}
            />,
        );

        await click(mount.container.querySelector<HTMLElement>('[data-testid="rogue"]')!);

        expect(proposals).to.have.length(0);
    });

    it('should never emit when the host hides the icon field entirely', async () => {
        await mount.render(
            <Harness proposals={[]} capabilities={{ ...allowEverything, fields: { label: 'editable' } }} />,
        );

        expect(mount.parts('icon')).to.have.length(0);
    });

    it('should prefer an overriding chooser over the picker', async () => {
        await mount.render(
            <Harness proposals={[]} renderIconField={() => <span data-testid='override'>custom</span>} />,
        );

        expect(mount.container.querySelector('[data-testid="override"]')).not.to.equal(null);
        expect(mount.container.querySelector('[data-cratis-part="trigger"]')).to.equal(null);
    });

    it('should show the host validation message under the picker', async () => {
        await mount.render(<Harness proposals={[]} validation={{ 'page-a': { icon: 'Pick an icon from the approved set.' } }} />);

        expect(mount.control('page-a', 'icon').textContent).to.contain('Pick an icon from the approved set.');
        expect(trigger('page-a').hasAttribute('data-invalid')).to.equal(true);
    });
});

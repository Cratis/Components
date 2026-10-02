// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { OrderedItemEditor } from '../OrderedItemEditor';
import { Harness, allowEverything, destinations, fixedItems, pageItems, restricted } from './given';
import { Mount } from './Mount';
import type { OrderedItemProposal } from '../OrderedItemProposal';

describe('when rendering fixed and configurable items', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    it('should list the fixed item in its own section apart from the configurable items', async () => {
        await mount.render(<Harness proposals={[]} />);

        const sections = mount.parts('section');
        expect(sections.map((section) => section.dataset.section)).to.deep.equal(['fixed', 'local']);
        expect(sections[0].querySelectorAll('[data-item-id]')).to.have.length(1);
        expect(sections[1].querySelectorAll('[data-item-id]')).to.have.length(2);
    });

    it('should name each section with a visible heading', async () => {
        await mount.render(<Harness proposals={[]} />);

        const [fixed, local] = mount.parts('section');
        const titleOf = (section: HTMLElement) => document.getElementById(section.getAttribute('aria-labelledby')!)!.textContent;
        expect(titleOf(fixed)).to.equal('Fixed items');
        expect(titleOf(local)).to.equal('Items');
    });

    it('should state in text that a fixed item is locked and never rely on opacity', async () => {
        await mount.render(<Harness proposals={[]} />);

        const home = mount.row('home');
        expect(home.getAttribute('data-locked')).to.equal('true');
        expect(home.textContent).to.contain('Locked');
        expect(mount.row('page-a').textContent).not.to.contain('Locked');
    });

    it('should give a fixed item no control', async () => {
        await mount.render(<Harness proposals={[]} />);

        const home = mount.row('home');
        expect(home.querySelector('button, input, select')).to.equal(null);
    });

    it('should show the fixed label, icon and destination as readable text', async () => {
        await mount.render(<Harness proposals={[]} />);

        const text = mount.row('home').textContent!;
        expect(text).to.contain('Home');
        expect(text).to.contain('example-icons/house');
        expect(text).to.contain('Overview');
    });

    it('should give a configurable item a label input, an icon field and a destination select', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(mount.control<HTMLInputElement>('page-a', 'label').value).to.equal('Page A');
        expect(mount.control('page-a', 'icon').textContent).to.contain('example-icons/file');
        expect(mount.control<HTMLSelectElement>('page-a', 'destination').value).to.equal('overview');
        expect(mount.control<HTMLSelectElement>('page-b', 'destination').value).to.equal('details');
    });

    it('should list destinations grouped by their group and ungrouped ones first', async () => {
        await mount.render(<Harness proposals={[]} />);

        const select = mount.control<HTMLSelectElement>('page-a', 'destination');
        const groups = Array.from(select.querySelectorAll('optgroup')).map((group) => group.label);
        expect(groups).to.deep.equal(['Reports']);
        expect(Array.from(select.options).map((option) => option.textContent)).to.deep.equal([
            'No destination', 'Settings', 'Overview', 'Details',
        ]);
    });

    it('should name every control after the item it belongs to', async () => {
        await mount.render(<Harness proposals={[]} />);

        expect(mount.control('page-a', 'destination').getAttribute('aria-label')).to.equal('Destination: Page A');
        expect(mount.control('page-a', 'moveDown').getAttribute('aria-label')).to.equal('Move Page A down');
        expect(mount.control('page-b', 'remove').getAttribute('aria-label')).to.equal('Remove Page B');
    });

    it('should explain an empty configurable collection', async () => {
        await mount.render(<Harness proposals={[]} initial={[]} />);

        expect(mount.parts('empty')[0].textContent).to.equal('No items yet.');
        expect(mount.parts('list')).to.have.length(1);
    });

    it('should flag a destination the host no longer lists', async () => {
        await mount.render(<Harness proposals={[]} initial={[{ id: 'page-a', label: 'Page A', destination: 'gone' }]} />);

        expect(mount.parts('message')[0].textContent).to.equal('This destination is no longer available.');
        expect(mount.control<HTMLSelectElement>('page-a', 'destination').getAttribute('aria-invalid')).to.equal('true');
    });

    it('should flag an icon the catalog can no longer supply', async () => {
        await mount.render(<Harness proposals={[]} isIconAvailable={() => false} />);

        expect(mount.control('page-a', 'icon').getAttribute('data-unavailable')).to.equal('true');
        expect(mount.control('page-a', 'icon').textContent).to.contain('This icon is no longer available.');
    });

    it('should show icons as text when the host supplies no icon field', async () => {
        await mount.render(
            <OrderedItemEditor
                items={pageItems()}
                capabilities={allowEverything}
                destinations={destinations}
                onChange={() => undefined}
            />,
        );

        expect(mount.control('page-a', 'icon').textContent).to.contain('example-icons/file');
        expect(mount.control('page-a', 'icon').querySelector('button')).to.equal(null);
    });

    it('should hide a field the host leaves out', async () => {
        await mount.render(
            <Harness proposals={[]} capabilities={{ ...allowEverything, fields: { label: 'editable' } }} />,
        );

        expect(mount.parts('destination')).to.have.length(0);
        expect(mount.parts('icon')).to.have.length(0);
        expect(mount.parts('label').length).to.be.greaterThan(0);
    });

    it('should show a read-only field as text with no input', async () => {
        await mount.render(<Harness proposals={[]} capabilities={restricted} />);

        expect(mount.control('page-a', 'icon').querySelector('button')).to.equal(null);
        expect(mount.control('page-a', 'icon').textContent).to.contain('example-icons/file');
    });

    it('should say why an operation is restricted', async () => {
        const proposals: OrderedItemProposal[] = [];
        await mount.render(<Harness proposals={proposals} capabilities={restricted} />);

        const notes = mount.parts('message').map((message) => message.textContent);
        expect(notes).to.include('This template does not allow new pages.');
        expect(notes).to.include('Icons are set by the template.');
    });

    it('should render the fixed items before nothing else changes when fixedItems is omitted', async () => {
        await mount.render(
            <OrderedItemEditor items={pageItems()} capabilities={allowEverything} onChange={() => undefined} />,
        );

        expect(mount.parts('section')).to.have.length(1);
        expect(fixedItems).to.have.length(1);
    });
});

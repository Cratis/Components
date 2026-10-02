// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Toolbar } from '../Toolbar';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarFolder } from '../ToolbarFolder';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { layoutItems } from './given';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const icon = <span aria-hidden='true'>T</span>;

describe('when rendering a drawer toolbar folder', () => {
    let container: HTMLDivElement;
    let root: Root;

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

    const render = async (element: React.ReactNode) => act(async () => root.render(element));
    const parts = (name: string) =>
        Array.from(container.querySelectorAll<HTMLElement>('[data-cratis-part]')).filter(
            (element) => element.getAttribute('data-cratis-part') === name,
        );
    const part = (name: string) => parts(name)[0];

    it('should show the heading as visible text that names the panel', async () => {
        await render(
            <Toolbar>
                <ToolbarFolder icon={icon} title='Layout tools' heading='Layout' presentation='drawer' items={layoutItems} />
            </Toolbar>,
        );

        const title = part('toolbar-folder-title');
        const panel = part('toolbar-folder-panel');
        expect(title.textContent).to.equal('Layout');
        expect(panel.getAttribute('aria-labelledby')).to.equal(title.id);
        expect(panel.hasAttribute('aria-label')).to.equal(false);
    });

    it('should fall back to the folder title for the heading', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);

        expect(part('toolbar-folder-title').textContent).to.equal('Layout');
    });

    it('should render one labeled tile per catalogue item in the supplied order', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);

        const tiles = parts('toolbar-folder-tile');
        expect(tiles.map((tile) => tile.getAttribute('data-item-id'))).to.deep.equal(['stack', 'row', 'masonry', 'frozen']);
        expect(tiles.map((tile) => tile.querySelector('[data-cratis-part="toolbar-folder-tile-label"]')!.textContent))
            .to.deep.equal(['Stack', 'Row', 'Masonry', 'Frozen']);
    });

    it('should render an unknown supplied type exactly like any other', async () => {
        await render(
            <ToolbarFolder
                icon={icon}
                title='Layout'
                presentation='drawer'
                items={[{ id: 'brand-new-type', title: 'Brand new', icon, payload: 1 }]}
            />,
        );

        const tile = part('toolbar-folder-tile');
        expect(tile.getAttribute('data-item-id')).to.equal('brand-new-type');
        expect(tile.textContent).to.contain('Brand new');
    });

    it('should hide the tile icon from assistive technology because the label names the tile', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);

        expect(part('toolbar-folder-tile-icon').getAttribute('aria-hidden')).to.equal('true');
    });

    it('should render ToolbarButton children as tiles after the catalogue', async () => {
        await render(
            <ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems.slice(0, 1)}>
                <ToolbarButton icon={icon} title='Composed' />
            </ToolbarFolder>,
        );

        const tiles = parts('toolbar-folder-tile');
        expect(tiles).to.have.length(2);
        expect(tiles[1].textContent).to.contain('Composed');
    });

    it('should expose a close button with a default accessible name', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);

        expect(part('toolbar-folder-close').getAttribute('aria-label')).to.equal('Close');
    });

    it('should localize the close button through the closeLabel prop', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' closeLabel='Lukk' items={layoutItems} />);

        expect(part('toolbar-folder-close').getAttribute('aria-label')).to.equal('Lukk');
    });

    it('should localize the close button through the provider messages', async () => {
        await render(
            <CratisComponentsProvider value={{ messages: { toolbar: { closeDrawer: 'SENTINEL-close' } } }}>
                <ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />
            </CratisComponentsProvider>,
        );

        expect(part('toolbar-folder-close').getAttribute('aria-label')).to.equal('SENTINEL-close');
    });

    it('should expose the disclosure state on the trigger', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);
        const trigger = part('toolbar-folder-trigger');
        const panel = part('toolbar-folder-panel');

        expect(trigger.getAttribute('aria-expanded')).to.equal('false');
        expect(trigger.getAttribute('aria-controls')).to.equal(panel.id);
        expect(panel.hasAttribute('inert')).to.equal(true);

        await act(async () => trigger.click());

        expect(trigger.getAttribute('aria-expanded')).to.equal('true');
        expect(panel.hasAttribute('inert')).to.equal(false);
    });

    it('should describe a disabled tile with its reason and keep it focusable', async () => {
        await render(<ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />);

        const tile = container.querySelector<HTMLButtonElement>('[data-item-id="frozen"]')!;
        expect(tile.getAttribute('aria-disabled')).to.equal('true');
        expect(tile.hasAttribute('disabled')).to.equal(false);
        expect(tile.getAttribute('data-disabled')).to.equal('true');
        expect(tile.draggable).to.equal(false);
        const description = container.querySelector(`#${CSS.escape(tile.getAttribute('aria-describedby')!)}`)!;
        expect(description.textContent).to.equal('Not available inside a template');
    });

    it('should apply the drawer part attributes', async () => {
        await render(
            <ToolbarFolder
                icon={icon}
                title='Layout'
                presentation='drawer'
                items={layoutItems.slice(0, 1)}
                pt={{
                    drawerHeader: { id: 'header-part' },
                    drawerTitle: { id: 'title-part' },
                    drawerClose: { id: 'close-part' },
                    tile: { id: 'tile-part' },
                    tileIcon: { id: 'tile-icon-part' },
                    tileLabel: { id: 'tile-label-part' },
                }}
            />,
        );

        expect(part('toolbar-folder-header').id).to.equal('header-part');
        expect(part('toolbar-folder-title').id).to.equal('title-part');
        expect(part('toolbar-folder-close').id).to.equal('close-part');
        expect(part('toolbar-folder-tile').id).to.equal('tile-part');
        expect(part('toolbar-folder-tile-icon').id).to.equal('tile-icon-part');
        expect(part('toolbar-folder-tile-label').id).to.equal('tile-label-part');
    });

    it('should position the drawer inside the viewport on a horizontal toolbar', async () => {
        const rectangle = { left: 8, top: 6, right: 48, bottom: 46, width: 40, height: 40, x: 8, y: 6, toJSON: () => ({}) };
        const original = HTMLElement.prototype.getBoundingClientRect;
        HTMLElement.prototype.getBoundingClientRect = () => rectangle;
        try {
            await render(
                <Toolbar orientation='horizontal'>
                    <ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />
                </Toolbar>,
            );
            await act(async () => part('toolbar-folder-trigger').click());
        } finally {
            HTMLElement.prototype.getBoundingClientRect = original;
        }

        expect(part('toolbar-folder-panel').getAttribute('data-side')).to.equal('bottom');
    });
});

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
import type { ToolbarDrawerItem } from '../ToolbarDrawerItem';
import { layoutItems } from './given';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const icon = <span aria-hidden='true'>T</span>;

const dragEvent = (type: string, dataTransfer: Partial<DataTransfer>) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    return event;
};

describe('when using a drawer toolbar folder', () => {
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

    const tile = (id: string) => container.querySelector<HTMLButtonElement>(`[data-item-id="${id}"]`)!;
    const part = (name: string) =>
        Array.from(container.querySelectorAll<HTMLElement>('[data-cratis-part]')).find(
            (element) => element.getAttribute('data-cratis-part') === name,
        )!;
    const open = async () => act(async () => part('toolbar-folder-trigger').click());
    const flush = async () => act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 0)); });

    const renderDrawer = async (props: Partial<React.ComponentProps<typeof ToolbarFolder>> = {}) => {
        await act(async () =>
            root.render(
                <Toolbar>
                    <ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} {...props} />
                </Toolbar>,
            ),
        );
        await open();
    };

    describe('and a tile is activated', () => {
        it('should deliver the exact item and payload to onActivate on click', async () => {
            const activated: ToolbarDrawerItem[] = [];
            await renderDrawer({ onActivate: (item) => activated.push(item) });

            await act(async () => tile('masonry').click());

            expect(activated).to.have.length(1);
            expect(activated[0]).to.equal(layoutItems[2]);
            expect(activated[0].payload).to.equal(layoutItems[2].payload);
        });

        it('should activate through the keyboard because a tile is a native button', async () => {
            await renderDrawer({ onActivate: () => undefined });

            expect(tile('stack').tagName).to.equal('BUTTON');
            expect(tile('stack').getAttribute('type')).to.equal('button');
        });

        it('should not activate a disabled tile', async () => {
            const activated: ToolbarDrawerItem[] = [];
            await renderDrawer({ onActivate: (item) => activated.push(item) });

            await act(async () => tile('frozen').click());

            expect(activated).to.have.length(0);
        });

        it('should keep the drawer open by default so several items can be inserted', async () => {
            await renderDrawer({ onActivate: () => undefined });

            await act(async () => tile('row').click());

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(false);
        });

        it('should close the drawer and restore focus when closeOnInsert is set', async () => {
            await renderDrawer({ onActivate: () => undefined, closeOnInsert: true });

            await act(async () => tile('row').click());
            await flush();

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(true);
            expect(document.activeElement).to.equal(part('toolbar-folder-trigger'));
        });
    });

    describe('and a tile is dragged', () => {
        const startDrag = async (id: string) => {
            const stored: Record<string, string> = {};
            const dataTransfer = {
                setData: (type: string, value: string) => { stored[type] = value; },
                effectAllowed: 'none',
            } as unknown as DataTransfer;
            await act(async () => { tile(id).dispatchEvent(dragEvent('dragstart', dataTransfer)); });
            return { stored, dataTransfer };
        };

        it('should make catalogue tiles draggable by default', async () => {
            await renderDrawer();

            expect(tile('stack').draggable).to.equal(true);
        });

        it('should allow dragging to be turned off', async () => {
            await renderDrawer({ draggable: false });

            expect(tile('stack').draggable).to.equal(false);
        });

        it('should serialize the exact payload onto the data transfer', async () => {
            await renderDrawer({ onItemDragStart: () => undefined });

            const { stored, dataTransfer } = await startDrag('stack');

            expect(JSON.parse(stored['application/json'])).to.deep.equal(layoutItems[0].payload);
            expect(dataTransfer.effectAllowed).to.equal('copy');
        });

        it('should hand the original item to onItemDragStart', async () => {
            const started: ToolbarDrawerItem[] = [];
            await renderDrawer({ onItemDragStart: (item) => started.push(item) });

            await startDrag('masonry');

            expect(started[0]).to.equal(layoutItems[2]);
            expect(started[0].payload).to.equal(layoutItems[2].payload);
        });

        it('should report the payload to the owning toolbar like any other toolbar button', async () => {
            const payloads: unknown[] = [];
            await act(async () =>
                root.render(
                    <Toolbar onItemDragStart={(data) => payloads.push(data)}>
                        <ToolbarFolder icon={icon} title='Layout' presentation='drawer' items={layoutItems} />
                    </Toolbar>,
                ),
            );
            await open();

            await startDrag('row');

            expect(payloads).to.deep.equal([layoutItems[1].payload]);
        });

        it('should not drag a disabled tile', async () => {
            const started: ToolbarDrawerItem[] = [];
            await renderDrawer({ onItemDragStart: (item) => started.push(item) });

            await startDrag('frozen');

            expect(started).to.have.length(0);
        });

        it('should keep the drawer open while the drag is in flight and mark it as dragging', async () => {
            await renderDrawer();

            await startDrag('stack');

            const panel = part('toolbar-folder-panel');
            expect(panel.hasAttribute('inert')).to.equal(false);
            expect(panel.hasAttribute('data-dragging')).to.equal(true);
        });

        it('should restore the drawer when the drag is cancelled', async () => {
            const ended: ToolbarDrawerItem[] = [];
            await renderDrawer({ onItemDragEnd: (item) => ended.push(item), closeOnInsert: true });
            const { dataTransfer } = await startDrag('stack');

            await act(async () => {
                tile('stack').dispatchEvent(dragEvent('dragend', Object.assign(dataTransfer, { dropEffect: 'none' })));
            });

            const panel = part('toolbar-folder-panel');
            expect(panel.hasAttribute('data-dragging')).to.equal(false);
            expect(panel.hasAttribute('inert')).to.equal(false);
            expect(ended).to.deep.equal([layoutItems[0]]);
        });

        it('should close the drawer after a completed drop when closeOnInsert is set', async () => {
            await renderDrawer({ closeOnInsert: true });
            const { dataTransfer } = await startDrag('stack');

            await act(async () => {
                tile('stack').dispatchEvent(dragEvent('dragend', Object.assign(dataTransfer, { dropEffect: 'copy' })));
            });

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(true);
        });

        it('should drag a ToolbarButton child as a tile when it is draggable', async () => {
            const started: unknown[] = [];
            await act(async () =>
                root.render(
                    <Toolbar>
                        <ToolbarFolder icon={icon} title='Layout' presentation='drawer'>
                            <ToolbarButton
                                icon={icon}
                                title='Composed'
                                draggable
                                data={{ kind: 'composed' }}
                                onDragStart={(data) => started.push(data)}
                            />
                        </ToolbarFolder>
                    </Toolbar>,
                ),
            );
            await open();
            const composed = part('toolbar-folder-tile');
            const dataTransfer = { setData: () => undefined, effectAllowed: 'none' } as unknown as DataTransfer;

            await act(async () => { composed.dispatchEvent(dragEvent('dragstart', dataTransfer)); });

            expect(started).to.deep.equal([{ kind: 'composed' }]);
        });
    });

    describe('and the drawer is dismissed', () => {
        it('should close from the close button and restore trigger focus', async () => {
            await renderDrawer();
            part('toolbar-folder-close').focus();

            await act(async () => part('toolbar-folder-close').click());
            await flush();

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(true);
            expect(part('toolbar-folder-trigger').getAttribute('aria-expanded')).to.equal('false');
            expect(document.activeElement).to.equal(part('toolbar-folder-trigger'));
        });

        it('should close on Escape from a tile and restore trigger focus', async () => {
            await renderDrawer();
            tile('stack').focus();

            await act(async () => {
                tile('stack').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });
            await flush();

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(true);
            expect(document.activeElement).to.equal(part('toolbar-folder-trigger'));
        });

        it('should close on an outside pointer press without activating anything', async () => {
            const activated: ToolbarDrawerItem[] = [];
            await renderDrawer({ onActivate: (item) => activated.push(item) });

            await act(async () => { document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); });

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(true);
            expect(activated).to.have.length(0);
        });

        it('should stay open for a press inside the drawer', async () => {
            await renderDrawer();

            await act(async () => { tile('stack').dispatchEvent(new Event('pointerdown', { bubbles: true })); });

            expect(part('toolbar-folder-panel').hasAttribute('inert')).to.equal(false);
        });

        it('should clear a stale drag state when the drawer closes', async () => {
            await renderDrawer();
            await act(async () => { tile('stack').dispatchEvent(dragEvent('dragstart', { setData: () => undefined } as unknown as DataTransfer)); });

            await act(async () => part('toolbar-folder-close').click());

            expect(part('toolbar-folder-panel').hasAttribute('data-dragging')).to.equal(false);
        });
    });
});

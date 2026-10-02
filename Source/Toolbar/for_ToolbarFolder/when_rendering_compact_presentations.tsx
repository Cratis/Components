// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarFolder } from '../ToolbarFolder';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const icon = <span aria-hidden='true'>T</span>;

describe('when rendering the existing compact toolbar folder presentations', () => {
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

    const panel = () => container.querySelector<HTMLElement>('[data-cratis-part="toolbar-folder-panel"]')!;

    const renderFolder = async (props: Partial<React.ComponentProps<typeof ToolbarFolder>> = {}) => {
        await act(async () =>
            root.render(
                <ToolbarFolder icon={icon} title='Tools' {...props}>
                    <ToolbarButton icon={icon} title='One' />
                    <ToolbarButton icon={icon} title='Two' />
                    <ToolbarButton icon={icon} title='Three' />
                    <ToolbarButton icon={icon} title='Four' />
                    <ToolbarButton icon={icon} title='Five' />
                </ToolbarFolder>,
            ),
        );
    };

    it('should default to the icon-only grid with fixed 2.5rem cells', async () => {
        await renderFolder();

        expect(panel().style.gridTemplateColumns).to.equal('repeat(3, minmax(2.5rem, 2.5rem))');
        expect(panel().getAttribute('data-mode')).to.equal('grid');
    });

    it('should cap grid columns at 5 by default and honor maxColumns', async () => {
        await renderFolder({ maxColumns: 2 });

        expect(panel().style.gridTemplateColumns).to.equal('repeat(2, minmax(2.5rem, 2.5rem))');
    });

    it('should not render any drawer chrome by default', async () => {
        await renderFolder();

        expect(container.querySelector('[data-cratis-part="toolbar-folder-header"]')).to.equal(null);
        expect(container.querySelector('[data-cratis-part="toolbar-folder-close"]')).to.equal(null);
        expect(panel().hasAttribute('data-presentation')).to.equal(false);
        expect(panel().classList.contains('toolbar-folder-panel--drawer')).to.equal(false);
    });

    it('should name the panel with the folder title as an aria-label', async () => {
        await renderFolder();

        expect(panel().getAttribute('aria-label')).to.equal('Tools');
        expect(panel().hasAttribute('aria-labelledby')).to.equal(false);
    });

    it('should keep icon-only buttons in grid mode', async () => {
        await renderFolder();

        const buttons = container.querySelectorAll('[data-cratis-part="button"]');
        expect(buttons).to.have.length(5);
        expect(container.querySelector('[data-cratis-part="toolbar-folder-tile"]')).to.equal(null);
        expect(buttons[0].querySelector('[data-cratis-part="label"]')).to.equal(null);
    });

    it('should keep the labeled list in list mode', async () => {
        await renderFolder({ mode: 'list' });

        const button = container.querySelector('[data-cratis-part="button"]')!;
        expect(panel().classList.contains('toolbar-folder-panel--list')).to.equal(true);
        expect(button.classList.contains('toolbar-button--list')).to.equal(true);
        expect(button.querySelector('[data-cratis-part="label"]')!.textContent).to.equal('One');
        expect(panel().style.gridTemplateColumns).to.equal('');
    });

    it('should ignore items outside the drawer presentation', async () => {
        await renderFolder({ items: [{ id: 'ignored', title: 'Ignored', icon, payload: 1 }] });

        expect(container.textContent).not.to.contain('Ignored');
    });

    it('should still toggle and close on Escape', async () => {
        await renderFolder();
        const trigger = container.querySelector<HTMLButtonElement>('[data-cratis-part="toolbar-folder-trigger"]')!;
        await act(async () => trigger.click());
        expect(trigger.getAttribute('aria-expanded')).to.equal('true');

        await act(async () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });

        expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    });

    it('should not react to pointerdown outside because only the drawer listens for it', async () => {
        await renderFolder();
        const trigger = container.querySelector<HTMLButtonElement>('[data-cratis-part="toolbar-folder-trigger"]')!;
        await act(async () => trigger.click());

        await act(async () => { document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })); });

        expect(trigger.getAttribute('aria-expanded')).to.equal('true');
    });
});

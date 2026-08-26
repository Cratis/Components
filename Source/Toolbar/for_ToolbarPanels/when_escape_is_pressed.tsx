// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarFanOutItem } from '../ToolbarFanOutItem';
import { ToolbarFolder } from '../ToolbarFolder';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const icon = <span aria-hidden='true'>T</span>;

describe('when Escape is pressed in an expanded Toolbar panel', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const verifyEscape = async (
        element: React.ReactNode,
        triggerPart: string,
        panelPart: string,
    ) => {
        await act(async () => root.render(element));
        const trigger = container.querySelector<HTMLButtonElement>(
            `[data-cratis-part="${triggerPart}"]`,
        )!;
        await act(async () => trigger.click());
        const panel = container.querySelector<HTMLElement>(
            `[data-cratis-part="${panelPart}"]`,
        )!;
        const nested = panel.querySelector<HTMLButtonElement>('button')!;
        nested.focus();

        await act(async () => {
            nested.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
            );
            await new Promise((resolve) => window.setTimeout(resolve, 0));
        });

        expect(panel.hasAttribute('inert')).to.equal(true);
        expect(document.activeElement).to.equal(trigger);
    };

    it('should_close_a_folder_and_restore_trigger_focus', async () => {
        await verifyEscape(
            <ToolbarFolder icon={icon} title='Tools'>
                <ToolbarButton
                    icon={icon}
                    title='Nested tool'
                    pt={{ root: { onKeyDown: (event) => event.stopPropagation() } }}
                />
            </ToolbarFolder>,
            'toolbar-folder-trigger',
            'toolbar-folder-panel',
        );
    });

    it('should_close_a_fanout_and_restore_trigger_focus', async () => {
        await verifyEscape(
            <ToolbarFanOutItem icon={icon} tooltip='Shapes'>
                <ToolbarButton
                    icon={icon}
                    title='Nested shape'
                    pt={{ root: { onKeyDown: (event) => event.stopPropagation() } }}
                />
            </ToolbarFanOutItem>,
            'fanout-trigger',
            'fanout-panel',
        );
    });
});

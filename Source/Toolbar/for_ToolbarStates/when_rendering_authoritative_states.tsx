// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarContext } from '../ToolbarContext';
import { ToolbarFanOutItem } from '../ToolbarFanOutItem';
import { ToolbarFolder } from '../ToolbarFolder';
import { ToolbarSection } from '../ToolbarSection';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const canonicalStates = [
    'disabled',
    'loading',
    'selected',
    'open',
    'invalid',
    'readonly',
    'busy',
    'focused',
    'pressed',
] as const;

const expectOnlyStates = (
    element: Element,
    expectedStates: ReadonlyArray<(typeof canonicalStates)[number]>,
) => {
    for (const state of canonicalStates) {
        const value = element.getAttribute(`data-${state}`);
        expect(value, state).to.equal(
            expectedStates.includes(state) ? 'true' : null,
        );
        expect(value).not.to.equal('false');
    }
};

const renderStatic = (element: React.ReactNode) => {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(element);
    return container;
};

const icon = <span aria-hidden='true'>T</span>;

describe('when rendering authoritative Toolbar states', () => {
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

    it('should map an active tool to selected while preserving active', () => {
        const rendered = renderStatic(<ToolbarButton icon={icon} title='Draw' active />);
        const button = rendered.querySelector('[data-cratis-part="button"]')!;

        expectOnlyStates(button, ['selected']);
        expect(button.getAttribute('data-active')).to.equal('true');
    });

    it('should omit canonical and legacy selection states from an inactive tool', () => {
        const rendered = renderStatic(<ToolbarButton icon={icon} title='Draw' />);
        const button = rendered.querySelector('[data-cratis-part="button"]')!;

        expectOnlyStates(button, []);
        expect(button.hasAttribute('data-active')).to.equal(false);
    });

    it('should map only the active context to selected while preserving active', () => {
        const rendered = renderStatic(
            <ToolbarSection activeContext='draw'>
                <ToolbarContext name='draw'>Draw</ToolbarContext>
                <ToolbarContext name='text'>Text</ToolbarContext>
            </ToolbarSection>,
        );
        const contexts = rendered.querySelectorAll('[data-cratis-part="toolbar-context"]');

        expectOnlyStates(contexts[0], ['selected']);
        expect(contexts[0].getAttribute('data-active')).to.equal('true');
        expectOnlyStates(contexts[1], []);
        expect(contexts[1].hasAttribute('data-active')).to.equal(false);
    });

    const verifyOpenState = async (element: React.ReactNode) => {
        await act(async () => root.render(element));
        const stateOwners = Array.from(
            container.querySelectorAll('#state-root, #state-trigger, #state-panel'),
        );
        const trigger = container.querySelector<HTMLButtonElement>('#state-trigger')!;
        const panel = container.querySelector('#state-panel')!;

        for (const stateOwner of stateOwners) expectOnlyStates(stateOwner, []);
        expect(panel.hasAttribute('data-expanded')).to.equal(false);

        await act(async () => trigger.click());

        for (const stateOwner of stateOwners) expectOnlyStates(stateOwner, ['open']);
        expect(panel.getAttribute('data-expanded')).to.equal('true');
    };

    it('should map folder disclosure state to open on every owning part', async () => {
        await verifyOpenState(
            <ToolbarFolder
                icon={icon}
                title='Tools'
                pt={{
                    root: { id: 'state-root' },
                    trigger: { id: 'state-trigger' },
                    panel: { id: 'state-panel' },
                }}
            >
                <ToolbarButton icon={icon} title='Nested tool' />
            </ToolbarFolder>,
        );
    });

    it('should map fan-out disclosure state to open on every owning part', async () => {
        await verifyOpenState(
            <ToolbarFanOutItem
                icon={icon}
                tooltip='Shapes'
                pt={{
                    root: { id: 'state-root' },
                    trigger: { id: 'state-trigger' },
                    panel: { id: 'state-panel' },
                }}
            >
                <ToolbarButton icon={icon} title='Nested shape' />
            </ToolbarFanOutItem>,
        );
    });
});

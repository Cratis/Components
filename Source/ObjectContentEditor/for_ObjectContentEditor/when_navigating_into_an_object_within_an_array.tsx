// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ObjectContentEditor } from '../ObjectContentEditor';
import type { Json } from '../../types/JsonSchema';

const object: Json = {
    eventType: 'PurchaseOrderRaised',
    causation: [
        {
            type: 'Command',
            properties: { commandType: 'RaisePurchaseOrder' },
        },
        {
            type: 'Reactor',
            properties: { reactorType: 'PurchaseOrderReactor' },
        },
    ],
};

const schema = {
    type: 'object' as const,
    properties: {
        eventType: { type: 'string' as const },
        causation: {
            type: 'array' as const,
            items: {
                type: 'object' as const,
                properties: {
                    type: { type: 'string' as const },
                    properties: { type: 'object' as const },
                },
            },
        },
    },
};

describe('when navigating into an object within an array', () => {
    let container: HTMLDivElement;
    let root: Root;

    const click = async (selector: string) => {
        const element = container.querySelector<HTMLButtonElement>(selector);
        if (!element) throw new Error(`Nothing matched '${selector}'.`);
        await act(async () => element.click());
    };

    const labels = () =>
        Array.from(container.querySelectorAll('tbody tr td:first-child')).map(
            (cell) => cell.textContent,
        );

    const breadcrumb = () =>
        container.querySelector('.cratis-object-navigational-bar')?.textContent ?? '';

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(<ObjectContentEditor object={object} schema={schema} />);
        });
        await click('button[aria-label="Open causation, 2 items"]');
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should show the nested object of the element that was navigated into', async () => {
        await click('button[aria-label="Open properties"]');
        expect(labels()).to.deep.equal(['commandType']);
    });

    it('should show the nested object of a later element', async () => {
        const buttons = Array.from(
            container.querySelectorAll<HTMLButtonElement>(
                'button[aria-label="Open properties"]',
            ),
        );
        await act(async () => buttons[1].click());
        expect(labels()).to.deep.equal(['reactorType']);
    });

    it('should include the array index in the breadcrumb', async () => {
        await click('button[aria-label="Open properties"]');
        expect(breadcrumb()).to.contain('causation').and.to.contain('[0]').and.to.contain('properties');
    });

    it('should navigate back out to the array element', async () => {
        await click('button[aria-label="Open properties"]');
        await click('button[aria-label="Navigate back"]');
        expect(labels()).to.deep.equal(['type', 'properties']);
    });
});

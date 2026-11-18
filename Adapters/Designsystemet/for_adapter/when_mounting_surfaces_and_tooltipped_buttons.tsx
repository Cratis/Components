// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@digdir/designsystemet-web';
import { expect } from 'chai';
import { createElement, type ComponentType } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { designsystemetUiLibrary } from '../src/index.js';

type SlotId = keyof typeof designsystemetUiLibrary.slots;

let root: Root | undefined;
let host: HTMLElement | undefined;

const mount = async (slotId: SlotId, props: Record<string, unknown>) => {
    const declaration = designsystemetUiLibrary.slots[slotId];
    if (!declaration) throw new Error(`Missing ${slotId} declaration.`);
    // SAFETY: Fixture props are paired with the corresponding public slot contract.
    const Component = declaration.render as unknown as ComponentType<Record<string, unknown>>;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
        root?.render(createElement(Component, props));
    });
    // Let any mutation observers registered by the upstream scripts run.
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
    });
    return host;
};

afterEach(async () => {
    await act(async () => root?.unmount());
    host?.remove();
    root = undefined;
    host = undefined;
});

describe('when mounting surfaces and tooltipped buttons', () => {
    it('should not activate a heading link when the surface body is clicked', async () => {
        let linkActivations = 0;
        const container = await mount('common.surface', {
            children: createElement(
                'div',
                null,
                createElement(
                    'h2',
                    null,
                    createElement(
                        'a',
                        {
                            href: '#heading',
                            onClick: (event: { preventDefault(): void }) => {
                                event.preventDefault();
                                linkActivations += 1;
                            },
                        },
                        'Heading link',
                    ),
                ),
                createElement('p', { 'data-testid': 'body' }, 'Ordinary body'),
            ),
        });
        const surface = container.firstElementChild as HTMLElement;
        expect(surface.hasAttribute('data-clickdelegatefor')).to.equal(false);
        await act(async () => {
            container.querySelector<HTMLElement>('[data-testid="body"]')?.click();
            surface.click();
        });
        expect(linkActivations).to.equal(0);
    });

    for (const [slotId, props] of [
        ['common.iconButton', { icon: '+', 'aria-label': 'Delete selected row', tooltip: 'More details' }],
        ['common.button', { icon: '+', 'aria-label': 'Delete selected row', tooltip: 'More details' }],
        ['common.button', { label: 'Delete', 'aria-label': 'Delete selected row', tooltip: 'More details' }],
    ] as const) {
        it(`should keep the caller's accessible name on ${slotId} with a tooltip (${'label' in props ? 'visible text' : 'icon only'})`, async () => {
            const container = await mount(slotId, { ...props });
            const button = container.querySelector('button') as HTMLButtonElement;
            expect(button.getAttribute('aria-label')).to.equal('Delete selected row');
            expect(button.getAttribute('title')).to.equal('More details');
            expect(button.hasAttribute('data-tooltip')).to.equal(false);
        });
    }
});

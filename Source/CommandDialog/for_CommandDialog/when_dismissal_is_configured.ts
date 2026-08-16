// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { CommandDialog } from '../CommandDialog';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';

vi.mock('@cratis/arc.react/commands', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('@cratis/arc.react/commands');
    return {
        ...actual,
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => ({
            isValid: true,
            setCommandValues: () => { },
            setCommandResult: () => { },
        }),
        useCommandInstance: () => ({}),
    };
});

class TestCommand {
    name: string = '';
}

/**
 * `CommandDialog` inherits `Omit<DialogProps, 'children'>`, so every dialog prop type-checks at
 * the call site. That made it possible for a prop to be *accepted and silently inert*: an
 * undestructured prop fell into the rest object and was spread onto `CommandForm` instead of
 * reaching the `Dialog`, with nothing to indicate it had gone nowhere. `dismissable` and
 * `closeAriaLabel` shipped in exactly that state.
 *
 * These specs assert the props actually arrive, by looking for the header close button they
 * govern — the affordance a caller is asking for when they pass them.
 */
describe('when dismissal is configured on a command dialog', () => {
    let root: Root;
    let container: HTMLDivElement;

    const render = async (props: { dismissable?: boolean; closeAriaLabel?: string; buttons?: React.ReactNode }) => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { } unobserve() { } disconnect() { }
        };

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(React.createElement(CratisComponentsProvider, null,
                React.createElement(CommandDialog<TestCommand>, {
                    command: TestCommand as unknown as new () => object,
                    title: 'Register',
                    visible: true,
                    ...props,
                    children: React.createElement('p', null, 'Body')
                })));
        });
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
    };

    const closeButton = () => document.querySelector('[data-scope="dialog"][data-part="close"]');

    afterEach(async () => {
        await act(async () => { root.unmount(); });
        container.remove();
    });

    it('should forward dismissable so a custom footer can keep its close button', async () => {
        await render({ buttons: React.createElement('button', { type: 'button' }, 'Go'), dismissable: true });

        (!!closeButton()).should.be.true;
    });

    it('should forward dismissable so a dialog can withdraw its close button', async () => {
        await render({ dismissable: false });

        (!!closeButton()).should.be.false;
    });

    it('should forward closeAriaLabel to the close button', async () => {
        await render({ dismissable: true, closeAriaLabel: 'Lukk' });

        closeButton()!.getAttribute('aria-label')!.should.equal('Lukk');
    });
});

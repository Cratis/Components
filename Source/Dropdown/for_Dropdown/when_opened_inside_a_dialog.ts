// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Dialog } from '../../Dialogs/Dialog';
import { Dropdown } from '../Dropdown';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';

/**
 * The regression guard for what used to be two hand-rolled workarounds.
 *
 * On PrimeReact 10 a `Dropdown` opened inside a modal `Dialog` rendered its panel *inside* the
 * dialog's DOM subtree, so the dialog's scroll and stacking context clipped it, and the panel could
 * land underneath the dialog's own mask. The library carried two fixes for that: `appendTo={document.body}`
 * on every overlay-bearing field (Cratis/Components#115) and a `useOverlayZIndex` hook that raised a
 * panel to a z-index floor with a `MutationObserver` (Cratis/Components#117).
 *
 * PrimeReact 11 does both natively: `Select.Portal` defaults to `appendTo: 'body'`, and the shared
 * `@primeuix/utils` z-index registry assigns a later-opened overlay a value above whatever is already
 * registered — so the panel outranks the dialog it was opened from. Both workarounds were therefore
 * deleted rather than ported. This spec is what makes that deletion safe: it fails if a future
 * PrimeReact release stops portaling the panel or stops stacking it above the dialog, which is
 * exactly the signal that a workaround is needed again.
 */
describe('when a dropdown is opened inside a dialog', () => {
    let root: Root;
    let container: HTMLDivElement;
    let dialogPositionerZIndex: number;
    let panelZIndex: number;
    let panelIsInsideTheDialog: boolean;
    let panelIsPortaledToTheBody: boolean;

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        // Allotment and PrimeReact's positioner both observe their container; jsdom has no layout engine.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { } unobserve() { } disconnect() { }
        };

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(React.createElement(CratisComponentsProvider, {
                children: React.createElement(Dialog, {
                    title: 'Pick something',
                    visible: true,
                    buttons: null,
                    children: React.createElement(Dropdown, {
                        options: [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }],
                        optionLabel: 'name',
                        optionValue: 'id'
                    })
                })
            }));
        });
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });

        const trigger = document.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement;
        await act(async () => { trigger.click(); });
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });

        const dialogPositioner = document.querySelector('[data-scope="dialog"][data-part="positioner"]') as HTMLElement;
        const dialogPopup = document.querySelector('[data-scope="dialog"][data-part="popup"]') as HTMLElement;
        const panel = document.querySelector('[data-scope="select"][data-part="positioner"]') as HTMLElement;

        dialogPositionerZIndex = Number.parseInt(dialogPositioner.style.zIndex, 10);
        panelZIndex = Number.parseInt(panel.style.zIndex, 10);
        panelIsInsideTheDialog = dialogPopup.contains(panel);
        panelIsPortaledToTheBody = panel.parentElement === document.body;
    });

    afterEach(async () => {
        await act(async () => { root.unmount(); });
        container.remove();
    });

    it('should render the panel outside the dialog rather than inside its stacking context', () => {
        panelIsInsideTheDialog.should.be.false;
    });

    it('should portal the panel to the document body', () => {
        panelIsPortaledToTheBody.should.be.true;
    });

    it('should stack the panel above the dialog it was opened from', () => {
        panelZIndex.should.be.greaterThan(dialogPositionerZIndex);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../../Dialogs/Dialog';
import { Dropdown } from '../Dropdown';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';

/**
 * The dropdown popup must leave the dialog's clipping and stacking context. This is a
 * Cratis behavior contract rather than a renderer-specific DOM contract: the popup is
 * portaled to the document overlay container and carries the stable Cratis popover part.
 */
describe('when a dropdown is opened inside a dialog', () => {
    let root: Root;
    let container: HTMLDivElement;
    let dialogPositionerZIndex: number;
    let panelZIndex: number;
    let panelIsInsideTheDialog: boolean;
    let panelIsPortaledToTheBody: boolean;
    let panelUsesTheLegacyClassName: boolean;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver; the overlay only calls these observer methods.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };

        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
        document.documentElement.style.setProperty('--cratis-z-index-overlay', '1200');
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                React.createElement(CratisComponentsProvider, {
                    children: React.createElement(Dialog, {
                        title: 'Pick something',
                        visible: true,
                        buttons: null,
                        children: React.createElement(Dropdown, {
                            options: [
                                { id: '1', name: 'One' },
                                { id: '2', name: 'Two' },
                            ],
                            optionLabel: 'name',
                            optionValue: 'id',
                            'aria-label': 'Pick value',
                            panelClassName: 'product-dropdown-panel',
                            pt: {
                                listbox: { id: 'product-options' },
                                option: { 'aria-label': 'Product option' },
                            },
                        }),
                    }),
                }),
            );
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
        });

        const trigger = document.querySelector(
            '[data-cratis-part="trigger"]',
        ) as HTMLElement;
        await act(async () => {
            trigger.click();
        });
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
        });

        const dialogPositioner = document.querySelector(
            '.cratis-dialog__backdrop[data-cratis-part="backdrop"]',
        ) as HTMLElement;
        const dialogPopup = document.querySelector(
            '.cratis-dialog[data-cratis-part="root"]',
        ) as HTMLElement;
        const panel = document.querySelector(
            '[data-cratis-part="popover"]',
        ) as HTMLElement;

        const resolvedZIndex = (element: HTMLElement) => {
            const declaration = element.style.zIndex || getComputedStyle(element).zIndex;
            const variable = declaration.match(/var\((--[^)]+)\)/u)?.[1];
            const value = variable
                ? getComputedStyle(document.documentElement).getPropertyValue(variable)
                : declaration;
            return Number.parseInt(value, 10);
        };
        dialogPositionerZIndex = resolvedZIndex(dialogPositioner);
        panelZIndex = resolvedZIndex(panel);
        panelIsInsideTheDialog = dialogPopup.contains(panel);
        panelIsPortaledToTheBody =
            document.body.contains(panel) && !container.contains(panel);
        panelUsesTheLegacyClassName = panel.classList.contains('product-dropdown-panel');
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
        document.documentElement.style.removeProperty('--cratis-z-index-dialog');
        document.documentElement.style.removeProperty('--cratis-z-index-overlay');
    });

    it('should render the panel outside the dialog rather than inside its stacking context', () => {
        expect(panelIsInsideTheDialog).to.equal(false);
    });

    it('should portal the panel to the document body', () => {
        expect(panelIsPortaledToTheBody).to.equal(true);
    });

    it('should stack the panel above the dialog it was opened from', () => {
        expect(panelZIndex).to.be.greaterThan(dialogPositionerZIndex);
    });

    it('should map the legacy panel class to the Cratis popover', () => {
        expect(panelUsesTheLegacyClassName).to.equal(true);
    });

    it('should apply ordinary attributes to listbox and option parts', () => {
        expect(document.querySelector('#product-options')).not.to.equal(null);
        expect(
            document
                .querySelector('[data-cratis-part="option"]')
                ?.getAttribute('aria-label'),
        ).to.equal('Product option');
    });
});

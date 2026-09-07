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

const resolvedZIndex = (element: HTMLElement) => {
    const declaration = element.style.zIndex || getComputedStyle(element).zIndex;
    const variable = declaration.match(/var\((--[^)]+)\)/u)?.[1];
    const value = variable
        ? getComputedStyle(document.documentElement).getPropertyValue(variable)
        : declaration;
    return Number.parseInt(value, 10);
};

/**
 * A compound case beyond a dropdown in a single dialog: a dropdown opened inside a dialog that
 * was itself opened while another dialog was still open. The dropdown's popover must stack above
 * both dialogs, not just the elevated one it is nested in - it cannot fall back to the plain
 * overlay token, which sits above only a single, non-elevated dialog tier.
 */
describe('when a dropdown is opened inside a dialog opened from another dialog', () => {
    let root: Root;
    let container: HTMLDivElement;
    let firstDialogZIndex: number;
    let secondDialogZIndex: number;
    let panelZIndex: number;

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

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                React.createElement(
                    CratisComponentsProvider,
                    null,
                    React.createElement(Dialog, {
                        title: 'First dialog',
                        visible: true,
                        buttons: null,
                    }),
                    React.createElement(Dialog, {
                        title: 'Second dialog',
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
                        }),
                    }),
                ),
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

        const backdrops = document.querySelectorAll(
            '.cratis-dialog__backdrop[data-cratis-part="backdrop"]',
        );
        const [firstBackdrop, secondBackdrop] = Array.from(backdrops) as HTMLElement[];
        firstDialogZIndex = resolvedZIndex(firstBackdrop);
        secondDialogZIndex = resolvedZIndex(secondBackdrop);
        const panel = document.querySelector(
            '[data-cratis-part="popover"]',
        ) as HTMLElement;
        panelZIndex = resolvedZIndex(panel);
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
    });

    it('should stack the second dialog above the first', () => {
        expect(secondDialogZIndex).to.be.greaterThan(firstDialogZIndex);
    });

    it("should stack the dropdown panel above the dialog it was opened from", () => {
        expect(panelZIndex).to.be.greaterThan(secondDialogZIndex);
    });

    it('should stack the dropdown panel above the first dialog too', () => {
        expect(panelZIndex).to.be.greaterThan(firstDialogZIndex);
    });
});

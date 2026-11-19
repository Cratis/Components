// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SlotInteraction, SlotInteractionResult } from './SlotProfile.js';

type Evidence = Map<string, Readonly<Record<string, unknown>>>;

const pause = (milliseconds: number) =>
    new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));

const find = (root: ParentNode, selector: string) => root.querySelector<HTMLElement>(selector);

const press = (target: Element | null, key: string) => {
    for (const type of ['keydown', 'keyup'] as const) {
        target?.dispatchEvent(
            new KeyboardEvent(type, { key, code: key, bubbles: true, cancelable: true }),
        );
    }
};

/** Polls until the condition holds or the wait runs out; overlays open and close asynchronously. */
const settle = async (condition: () => boolean, milliseconds = 300) => {
    for (let waited = 0; waited < milliseconds && !condition(); waited += 20) {
        await pause(20);
    }
    return condition();
};

const isFocused = (element: Element | null) =>
    element !== null && element.ownerDocument.activeElement === element;

const callbackCount = (evidence: Evidence, slotId: string) => {
    const callbacks = evidence.get(slotId)?.callbacks;
    return typeof callbacks === 'number' ? callbacks : 0;
};

const interactiveParts = (container: ParentNode, selector: string) =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

/** A control a keyboard user can reach: natively focusable and not removed from the tab order. */
const keyboardReachable = (element: HTMLElement) =>
    !element.hasAttribute('disabled') && element.tabIndex >= 0;

const dialogInteraction =
    (evidence: Evidence): SlotInteraction =>
    async (document, container): Promise<SlotInteractionResult> => {
        const close = find(document, '[data-cratis-part="close"]');
        const root = close?.closest('[role="dialog"], dialog') ?? null;
        const focusInside = root !== null && root.contains(document.activeElement);
        close?.focus();
        const closeReachable = isFocused(close);
        evidence.delete('dialogs.dialog');
        const target = (root?.contains(document.activeElement) ? document.activeElement : root) ?? container;
        press(target, 'Escape');
        await pause(0);
        if (callbackCount(evidence, 'dialogs.dialog') === 0) {
            root?.dispatchEvent(new Event('cancel', { cancelable: true }));
            await pause(0);
        }
        return {
            focus: focusInside,
            keyboard: closeReachable,
            dismissal: callbackCount(evidence, 'dialogs.dialog') === 1,
        };
    };

interface OverlayProfile {
    readonly overlaySelector: string;
    readonly openKeys: readonly string[];
    readonly targetSelectors: readonly string[];
}

/** Presses each key on the target until the overlay opens and returns the key that did, if any. */
const openWithKeys = async (target: HTMLElement | null, keys: readonly string[], isOpen: () => boolean) => {
    for (const key of keys) {
        press(target, key);
        if (await settle(isOpen, 150)) return key;
    }
    return undefined;
};

/**
 * Opens an overlay slot from its focused trigger, or from its filter field when it has one, with the keys a keyboard user has, then dismisses
 * it with Escape. The trigger must open the overlay, Escape must close it and focus must return.
 */
const overlayInteraction =
    ({ overlaySelector, openKeys, targetSelectors }: OverlayProfile): SlotInteraction =>
    async (document, container): Promise<SlotInteractionResult> => {
        const trigger = targetSelectors
            .map((selector) => find(container, `[data-cratis-part="${selector}"]`))
            .find((candidate) => candidate !== null) ?? null;
        trigger?.focus();
        const triggerFocusable = isFocused(trigger);
        const isOpen = () => find(document, overlaySelector) !== null;
        const openBefore = isOpen();
        const openedWith = await openWithKeys(trigger, openKeys, isOpen);
        const opened = openedWith !== undefined;
        const activeWhenOpen = document.activeElement?.outerHTML.slice(0, 120);
        press(document.activeElement ?? trigger, 'Escape');
        const closed = opened && (await settle(() => !isOpen()));
        return {
            keyboard: triggerFocusable && opened,
            dismissal: closed,
            focus: closed && (await settle(() => isFocused(trigger))),
            detail: { openBefore, activeWhenOpen, triggerFocusable, openedWith, closed, active: document.activeElement?.outerHTML.slice(0, 80) },
        };
    };

const tooltipInteraction =
    (_evidence: Evidence): SlotInteraction =>
    async (document, container): Promise<SlotInteractionResult> => {
        const trigger = find(container, '[data-cratis-part="trigger"]');
        const popupCount = () => document.querySelectorAll('[data-cratis-part="popup"]').length;
        trigger?.focus();
        trigger?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await pause(1700);
        const shownOnFocus = popupCount() > 0;
        press(trigger, 'Escape');
        return {
            keyboard: isFocused(trigger) && shownOnFocus,
            settled: async () => ({ dismissal: shownOnFocus && (await settle(() => popupCount() === 0, 1000)) }),
        };
    };

const paginatorInteraction =
    (_evidence: Evidence): SlotInteraction =>
    async (_document, container): Promise<SlotInteractionResult> => {
        const controls = ['previous', 'next'].map((name) =>
            find(container, `[data-cratis-part="${name}"], [aria-label="${name === 'next' ? 'Next' : 'Previous'} page"]`),
        );
        const reachable = controls.every((control) => control !== null && keyboardReachable(control));
        const next = controls[1];
        next?.focus();
        const focusable = isFocused(next);
        const native = interactiveParts(container, 'button, a[href]').length > 0;
        return { keyboard: reachable && native, focus: focusable };
    };

const interactions: Readonly<Record<string, (evidence: Evidence) => SlotInteraction>> = {
    'dialogs.dialog': dialogInteraction,
    'dropdown.select': () => overlayInteraction({
            overlaySelector: '[data-cratis-part="listbox"]',
            openKeys: ['ArrowDown', 'Enter'],
            targetSelectors: ['filter', 'trigger'],
        }),
    'display.datePicker': () => overlayInteraction({
            overlaySelector: '[data-cratis-part="calendar"]',
            openKeys: ['Enter', ' ', 'ArrowDown'],
            targetSelectors: ['trigger'],
        }),
    'common.tooltip': tooltipInteraction,
    'datatables.paginator': paginatorInteraction,
};

/** Returns the keyboard, focus and dismissal interaction of a stable atomic slot. */
export const slotInteraction = (evidence: Evidence, slotId: string): SlotInteraction | undefined =>
    interactions[slotId]?.(evidence);

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SlotInteraction, SlotInteractionResult } from './SlotProfile.js';

type Evidence = Map<string, Readonly<Record<string, unknown>>>;

const pause = (milliseconds: number) =>
    new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));

const find = (root: ParentNode, selector: string) => root.querySelector<HTMLElement>(selector);

/** Elements a browser activates with Enter (on keydown) or Space (on keyup) as a click. */
const keyActivated = (element: Element | null): element is HTMLElement =>
    element instanceof HTMLElement && element.matches('button, [role="button"], a[href], summary');

/**
 * Presses a key the way a browser delivers it: keydown and keyup events, then the default activation of
 * a button or link, which a dispatched event never triggers by itself and which a handler can prevent.
 */
const press = (target: Element | null, key: string) => {
    if (!target) return;
    const send = (type: 'keydown' | 'keyup') => {
        const event = new KeyboardEvent(type, { key, code: key, bubbles: true, cancelable: true });
        target.dispatchEvent(event);
        return event.defaultPrevented;
    };
    const activates = keyActivated(target);
    const down = send('keydown');
    const canActivate = activates && !down;
    if (canActivate) activateKey(target, key, 'Enter');
    const up = send('keyup');
    if (canActivate && !up) activateKey(target, key, ' ');
};

const activateKey = (target: HTMLElement, key: string, activationKey: string) => {
    if (key === activationKey) target.click();
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
    /** Slot whose change callback must fire once when an option is chosen with the arrow keys and Enter. */
    readonly choosesSlot?: string;
}

/** Presses each key on the target until the overlay opens and returns the key that did, if any. */
const openWithKeys = async (target: HTMLElement | null, keys: readonly string[], isOpen: () => boolean) => {
    for (const key of keys) {
        press(target, key);
        if (await settle(isOpen, 150)) return key;
    }
    return undefined;
};

/** Reopens the overlay, moves to an option with ArrowDown, chooses it with Enter and reports whether the change callback fired once. */
const chooseWithKeys = async (
    evidence: Evidence,
    slotId: string,
    trigger: HTMLElement | null,
    overlay: { openKeys: readonly string[]; isOpen: () => boolean },
) => {
    const { openKeys, isOpen } = overlay;
    evidence.delete(slotId);
    trigger?.focus();
    if ((await openWithKeys(trigger, openKeys, isOpen)) === undefined) return false;
    const target = trigger?.ownerDocument.activeElement ?? trigger;
    press(target, 'ArrowDown');
    press(target, 'Enter');
    await pause(0);
    const selection = evidence.get(slotId);
    return selection?.callbacks === 1 && ['developer', 'admin', 'viewer'].includes(String(selection.value));
};

const optionalChoice = (
    evidence: Evidence,
    slotId: string | undefined,
    trigger: HTMLElement | null,
    overlay: { openKeys: readonly string[]; isOpen: () => boolean },
) => slotId === undefined ? true : chooseWithKeys(evidence, slotId, trigger, overlay);

/**
 * Opens an overlay slot from its focused trigger, or from its filter field when it has one, with the keys a keyboard user has, then dismisses
 * it with Escape. The trigger must open the overlay, Escape must close it and focus must return.
 */
const overlayInteraction =
    (evidence: Evidence, { overlaySelector, openKeys, targetSelectors, choosesSlot }: OverlayProfile): SlotInteraction =>
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
        const focusReturned = closed && (await settle(() => isFocused(trigger)));
        const chosen = await optionalChoice(evidence, choosesSlot, trigger, { openKeys, isOpen });
        return {
            keyboard: triggerFocusable && opened && chosen,
            dismissal: closed,
            focus: focusReturned,
            detail: { chosen, openBefore, activeWhenOpen, triggerFocusable, openedWith, closed, active: document.activeElement?.outerHTML.slice(0, 80) },
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

/** Activates next with Enter and previous with Space, and reports whether each raised the page change it names. */
const activateWithKeys = async (evidence: Evidence, previous: HTMLElement | null, next: HTMLElement | null) => {
    const slotId = 'datatables.paginator';
    evidence.delete(slotId);
    next?.focus();
    press(next, 'Enter');
    await pause(0);
    const forward = evidence.get(slotId);
    previous?.focus();
    press(previous, ' ');
    await pause(0);
    const backward = evidence.get(slotId);
    return forward?.page === 2 && backward?.page === 0 && backward.callbacks === 2;
};

const paginatorInteraction =
    (evidence: Evidence): SlotInteraction =>
    async (_document, container): Promise<SlotInteractionResult> => {
        const controls = ['previous', 'next'].map((name) =>
            find(container, `[data-cratis-part="${name}"], [aria-label="${name === 'next' ? 'Next' : 'Previous'} page"]`),
        );
        const reachable = controls.every((control) => control !== null && keyboardReachable(control));
        const next = controls[1];
        next?.focus();
        const focusable = isFocused(next);
        const native = interactiveParts(container, 'button, a[href]').length > 0;
        const pages = await activateWithKeys(evidence, controls[0], next);
        return { keyboard: reachable && native && pages, focus: focusable, detail: { reachable, native, pages } };
    };

const interactions: Readonly<Record<string, (evidence: Evidence) => SlotInteraction>> = {
    'dialogs.dialog': dialogInteraction,
    'dropdown.select': (evidence) => overlayInteraction(evidence, {
            overlaySelector: '[data-cratis-part="listbox"]',
            openKeys: ['ArrowDown', 'Enter'],
            targetSelectors: ['filter', 'trigger'],
            choosesSlot: 'dropdown.select',
        }),
    'display.datePicker': (evidence) => overlayInteraction(evidence, {
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

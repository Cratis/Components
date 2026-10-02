// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IconPicker, type IconPickerProps } from '../../IconPicker';
import type { IconPickerValue } from '../../IconPickerValue';

/** An icon picker mounted into a real document, holding its value the way a host does. */
export interface PickerInTheDom {
    /** The element the picker is rendered into. */
    container: HTMLDivElement;

    /** The React root rendering it. */
    root: Root;

    /** Every value the picker reported through `onChange`, in order. */
    changes: IconPickerValue[];

    /** The trigger button. */
    trigger: () => HTMLButtonElement;
}

type HostProps = Omit<IconPickerProps, 'value' | 'onChange'> & {
    initialValue: IconPickerValue | null;
    changes: IconPickerValue[];
    accept: boolean;
};

const Host = ({ initialValue, changes, accept, ...props }: HostProps) => {
    const [value, setValue] = useState(initialValue);
    return createElement(IconPicker, {
        ...props,
        value,
        onChange: (next: IconPickerValue) => {
            changes.push(next);
            if (accept) setValue(next);
        },
    });
};

/**
 * Renders an {@link IconPicker} whose value is held by a host.
 * @param props The picker's props, with the initial value in place of `value`.
 * @param accept Whether the host stores what the picker emits. A host that does not shows the picker staying put.
 * @returns The mounted picker.
 */
export const renderPicker = async (
    props: Omit<IconPickerProps, 'value' | 'onChange'> & { initialValue?: IconPickerValue | null },
    accept = true,
): Promise<PickerInTheDom> => {
    // SAFETY: React reads this process-wide test flag from globalThis.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const changes: IconPickerValue[] = [];
    const { initialValue = null, ...rest } = props;

    await act(async () => {
        root.render(createElement(Host, { ...rest, initialValue, changes, accept }));
    });

    return {
        container,
        root,
        changes,
        trigger: () => container.querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!,
    };
};

/**
 * Unmounts a picker rendered with {@link renderPicker}, and anything it portaled out.
 * @param picker The mounted picker.
 */
export const unmount = async (picker: PickerInTheDom) => {
    await act(async () => picker.root.unmount());
    picker.container.remove();
    document.body.querySelectorAll('[data-cratis-part="popover"]').forEach(element => element.remove());
};

/**
 * Clicks an element.
 * @param element The element to click.
 */
export const click = async (element: Element) => {
    await act(async () => (element as HTMLElement).click());
};

/**
 * Presses a key in an element.
 * @param element The element with focus.
 * @param key The key.
 */
export const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
};

/**
 * Types into the search field the way the browser reports it to React.
 * @param value The text the field should hold.
 */
export const typeSearch = async (value: string) => {
    const input = document.body.querySelector<HTMLInputElement>('[data-cratis-part="search"]')!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    await act(async () => {
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
};

/** Opens the popout through its trigger. */
export const open = async (picker: PickerInTheDom) => {
    await act(async () => {
        picker.trigger().focus();
    });
    await click(picker.trigger());
    await settle();
};

/** Lets pending timers and promises settle. */
export const settle = async (milliseconds = 60) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, milliseconds));
    });
};

/** Every tile in the open popout, in document order. */
export const tiles = () => [...document.body.querySelectorAll<HTMLElement>('[data-cratis-part="tile"]')];

/**
 * The tile with a name, optionally narrowed to a provider.
 * @param name The icon's display name.
 * @param provider The provider shown on the tile.
 */
export const tileNamed = (name: string, provider?: string) =>
    tiles().find(tile => {
        const tileName = tile.querySelector('[data-cratis-part="tileName"]')!.textContent;
        const tileProvider = tile.querySelector('[data-cratis-part="provider"]')?.textContent;
        return tileName === name && (provider === undefined || tileProvider === provider);
    });

/** The names of the tiles currently listed, in order. */
export const tileNames = () => tiles().map(tile => tile.querySelector('[data-cratis-part="tileName"]')!.textContent);

/** The popout's dialog, or null while closed. */
export const dialog = () => document.body.querySelector<HTMLElement>('[data-cratis-part="dialog"]');

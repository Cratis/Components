// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, useState } from 'react';
import { CratisComponentsProvider } from '../../../../Common/CratisComponentsProvider';
import {
    mountPrimitive,
    setNativeValue,
    type MountedPrimitive,
} from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { Dropdown } from '../../../Dropdown';

export const roles = [
    { label: 'Backend developer', value: 'backend' },
    { label: 'Frontend developer', value: 'frontend' },
    { label: 'Designer', value: 'designer' },
];

/**
 * How the consuming application answers `onChange`. `accepts` is the documented round trip;
 * the other two are the bindings a real application arrives at without meaning to, and the
 * Dropdown owes them the same committed selection, closed overlay and settled filter text.
 */
export type DropdownBinding = 'accepts' | 'never answers' | 'rewrites';

export interface MountedDropdown extends MountedPrimitive {
    changes: Array<string | null>;
    control: HTMLElement;
}

interface DropdownFixtureOptions {
    binding?: DropdownBinding;
    initialValue?: string | null;
    filter?: boolean;
}

const ensureBrowserGlobals = () => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() {
            return undefined;
        }
        unobserve() {
            return undefined;
        }
        disconnect() {
            return undefined;
        }
    };
};

export const mountDropdown = async ({
    binding = 'accepts',
    initialValue = null,
    filter = true,
}: DropdownFixtureOptions = {}): Promise<MountedDropdown> => {
    ensureBrowserGlobals();
    const changes: Array<string | null> = [];

    const Host = () => {
        const [value, setValue] = useState<string | null>(initialValue);
        return (
            <CratisComponentsProvider>
                <Dropdown<string | null>
                    aria-label='Role'
                    placeholder='Select a role'
                    filterPlaceholder='Find a role'
                    filter={filter}
                    options={roles}
                    optionLabel='label'
                    optionValue='value'
                    {...(binding === 'never answers' ? {} : { value })}
                    onChange={(next) => {
                        changes.push(next);
                        if (binding === 'accepts') setValue(next);
                        if (binding === 'rewrites')
                            setValue(next === null ? null : next.toUpperCase());
                    }}
                />
            </CratisComponentsProvider>
        );
    };

    const mounted = await mountPrimitive(<Host />);
    const control = mounted.container.querySelector<HTMLElement>(
        filter ? '[data-cratis-part="filter"]' : '[data-cratis-part="trigger"]',
    );
    if (!control) throw new Error('Dropdown fixture did not render.');
    return { ...mounted, changes, control };
};

export const focusDropdown = async (mounted: MountedDropdown) => {
    await act(async () => {
        mounted.control.focus();
        mounted.control.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
        mounted.control.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await Promise.resolve();
    });
};

export const typeIntoFilter = async (mounted: MountedDropdown, text: string) =>
    setNativeValue(mounted.control as HTMLInputElement, text);

export const pressKey = async (key: string, element?: HTMLElement) => {
    const target = element ?? (document.activeElement as HTMLElement);
    await act(async () => {
        target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        await Promise.resolve();
    });
};

export const filterText = (mounted: MountedDropdown) =>
    (mounted.control as HTMLInputElement).value;
export const isExpanded = (mounted: MountedDropdown) =>
    mounted.control.getAttribute('aria-expanded');
export const listbox = () =>
    document.querySelector<HTMLElement>('[data-cratis-part="listbox"]');
export const options = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'));
export const selectedState = (mounted: MountedDropdown) =>
    mounted.container
        .querySelector<HTMLElement>('[data-cratis-part="root"]')
        ?.getAttribute('data-selected');

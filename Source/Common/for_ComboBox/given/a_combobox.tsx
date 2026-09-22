// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, useState } from 'react';
import { CratisComponentsProvider } from '../../CratisComponentsProvider';
import { ComboBox, type ComboBoxOption, type ComboBoxProps } from '../../ComboBox';
import {
    mountPrimitive,
    setNativeValue,
    type MountedPrimitive,
} from '../../for_Primitives/given/a_primitive_dom';

export const roster: ComboBoxOption[] = [
    { key: 'acme', label: 'Acme AS', description: '987 654 325' },
    { key: 'birk', label: 'Birk Consulting', description: '912 345 688' },
    { key: 'cirrus', label: 'Cirrus Cloud', description: '923 456 780', disabled: true },
];

interface ComboBoxFixtureOptions extends Omit<
    ComboBoxProps,
    'options' | 'value' | 'onChange'
> {
    options?: ComboBoxOption[];
    initialValue?: string | null;
}

export interface MountedComboBox extends MountedPrimitive {
    changes: Array<string | null>;
    inputs: string[];
    actions: string[];
    input: HTMLInputElement;
    field: HTMLElement;
    trigger: HTMLButtonElement;
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

export const mountComboBox = async (
    options: ComboBoxFixtureOptions = {},
): Promise<MountedComboBox> => {
    ensureBrowserGlobals();
    const {
        options: entries = roster,
        initialValue = null,
        action,
        onInputChange,
        ...props
    } = options;
    const changes: Array<string | null> = [];
    const inputs: string[] = [];
    const actions: string[] = [];

    const ControlledComboBox = () => {
        const [value, setValue] = useState<string | null>(initialValue);
        return (
            <CratisComponentsProvider value={{ locale: 'en-US' }}>
                <ComboBox
                    {...props}
                    options={entries}
                    value={value}
                    onChange={(next) => {
                        changes.push(next);
                        setValue(next);
                    }}
                    onInputChange={(text) => {
                        inputs.push(text);
                        onInputChange?.(text);
                    }}
                    action={
                        action && {
                            label: action.label,
                            onAction: (text) => {
                                actions.push(text);
                                return action.onAction(text);
                            },
                        }
                    }
                />
            </CratisComponentsProvider>
        );
    };

    const mounted = await mountPrimitive(<ControlledComboBox />);
    const input = mounted.container.querySelector<HTMLInputElement>(
        'input[data-cratis-part="input"]',
    );
    const field = mounted.container.querySelector<HTMLElement>(
        '[data-cratis-part="root"]',
    );
    const trigger = mounted.container.querySelector<HTMLButtonElement>(
        '[data-cratis-part="trigger"]',
    );
    if (!input || !field || !trigger) throw new Error('ComboBox fixture did not render.');
    return { ...mounted, changes, inputs, actions, input, field, trigger };
};

export const typeIntoComboBox = async (mounted: MountedComboBox, text: string) =>
    setNativeValue(mounted.input, text);

export const pressComboBoxKey = async (mounted: MountedComboBox, key: string) => {
    await act(async () => {
        mounted.input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        mounted.input.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        await Promise.resolve();
    });
};

export const pressComboBoxTrigger = async (mounted: MountedComboBox) => {
    await act(async () => {
        const pointer = { bubbles: true, cancelable: true, button: 0, detail: 1 };
        if (typeof PointerEvent === 'function') {
            mounted.trigger.dispatchEvent(
                new PointerEvent('pointerdown', { ...pointer, pointerType: 'mouse' }),
            );
            mounted.trigger.dispatchEvent(
                new PointerEvent('pointerup', { ...pointer, pointerType: 'mouse' }),
            );
        } else {
            mounted.trigger.dispatchEvent(new MouseEvent('mousedown', pointer));
            mounted.trigger.dispatchEvent(new MouseEvent('mouseup', pointer));
        }
        mounted.trigger.dispatchEvent(new MouseEvent('click', pointer));
        await Promise.resolve();
    });
};

export const focusComboBox = async (mounted: MountedComboBox) => {
    await act(async () => {
        mounted.input.focus();
        mounted.input.dispatchEvent(new FocusEvent('focus', { bubbles: false }));
        mounted.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await Promise.resolve();
    });
};

export const options = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'));
export const listbox = () =>
    document.querySelector<HTMLElement>('[data-cratis-part="listbox"]');

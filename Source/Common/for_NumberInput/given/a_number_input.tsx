// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, useState } from 'react';
import { CratisComponentsProvider } from '../../CratisComponentsProvider';
import { NumberInput, type NumberInputProps } from '../../NumberInput';
import { NumberInputCommitReason } from '../../NumberInputCommitReason';
import {
    mountPrimitive,
    setNativeValue,
    type MountedPrimitive,
} from '../../for_Primitives/given/a_primitive_dom';

export interface RecordedNumberInputEvent {
    kind: 'change' | 'commit';
    value: number | null;
    reason?: NumberInputCommitReason;
}

interface NumberInputFixtureOptions extends Omit<
    NumberInputProps,
    'value' | 'onChange' | 'onCommit'
> {
    initialValue: number | null;
    providerLocale?: string;
    acceptChanges?: boolean;
    insideForm?: boolean;
}

export interface MountedNumberInput extends MountedPrimitive {
    events: RecordedNumberInputEvent[];
    input: HTMLInputElement;
    field: HTMLElement;
    stepButtons: HTMLButtonElement[];
    form?: HTMLFormElement;
}

export const mountNumberInput = async (
    options: NumberInputFixtureOptions,
): Promise<MountedNumberInput> => {
    const {
        initialValue,
        providerLocale = 'en-US',
        acceptChanges = true,
        insideForm = false,
        ...props
    } = options;
    const events: RecordedNumberInputEvent[] = [];

    const ControlledNumberInput = () => {
        const [value, setValue] = useState<number | null>(initialValue);
        const control = (
            <NumberInput
                {...props}
                value={value}
                onChange={(nextValue) => {
                    events.push({ kind: 'change', value: nextValue });
                    if (acceptChanges) setValue(nextValue);
                }}
                onCommit={(nextValue, reason) =>
                    events.push({ kind: 'commit', value: nextValue, reason })
                }
            />
        );
        return (
            <CratisComponentsProvider value={{ locale: providerLocale }}>
                {insideForm ? <form>{control}</form> : control}
            </CratisComponentsProvider>
        );
    };

    const mounted = await mountPrimitive(<ControlledNumberInput />);
    const input = mounted.container.querySelector<HTMLInputElement>(
        'input[data-cratis-part="input"]',
    );
    const field = mounted.container.querySelector<HTMLElement>(
        '[data-cratis-part="root"]',
    );
    if (!input || !field) throw new Error('NumberInput fixture did not render.');

    return {
        ...mounted,
        events,
        input,
        field,
        form: mounted.container.querySelector<HTMLFormElement>('form') ?? undefined,
        stepButtons: Array.from(
            mounted.container.querySelectorAll<HTMLButtonElement>(
                '[data-cratis-part="step"]',
            ),
        ),
    };
};

export const editNumberInput = async (mounted: MountedNumberInput, text: string) =>
    setNativeValue(mounted.input, text);

export const pressNumberInputKey = async (mounted: MountedNumberInput, key: string) => {
    await act(async () => {
        mounted.input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        await Promise.resolve();
    });
};

export const blurNumberInput = async (mounted: MountedNumberInput) => {
    await act(async () => {
        mounted.input.focus();
        mounted.input.blur();
        await Promise.resolve();
    });
};

export const pasteNumberInput = async (mounted: MountedNumberInput, text: string) => {
    mounted.input.setSelectionRange(0, mounted.input.value.length);
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
        value: { getData: () => text },
    });
    let eventsBeforeYield: RecordedNumberInputEvent[] = [];
    await act(async () => {
        mounted.input.dispatchEvent(event);
        eventsBeforeYield = [...mounted.events];
        await Promise.resolve();
    });
    return eventsBeforeYield;
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType, ReactNode } from 'react';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import {
    unstable_defineUiLibrary,
    type unstable_SlotMap,
    type unstable_UiLibrary,
} from '../../../renderer';

type AnyProps = Record<string, unknown>;

/** Props each stub slot received, keyed by slot id, for the latest render. */
export const slotCalls: Record<string, AnyProps[]> = {};

const stubValue = (type: string, input: HTMLInputElement) => {
    if (type === 'text') return input.value;
    if (type === 'number') return Number.isNaN(input.valueAsNumber) ? undefined : input.valueAsNumber;
    return input.checked;
};

const stub = (slotId: string, marker: string, type: string) => {
    const Stub = (props: AnyProps) => {
        (slotCalls[slotId] ??= []).push(props);
        const onChange = props.onChange as ((value: unknown) => void) | undefined;
        return (
            <input
                data-stub={marker}
                type={type}
                id={props.id as string | undefined}
                onChange={(event) =>
                    onChange?.(stubValue(type, event.currentTarget))
                }
                onBlur={props.onBlur as never}
            />
        );
    };
    return { mode: 'presentation', fidelity: 'native', render: Stub as ComponentType } as const;
};

const slots = {
    'common.textInput': stub('common.textInput', 'text', 'text'),
    'common.numberInput': stub('common.numberInput', 'number', 'number'),
    'common.textArea': stub('common.textArea', 'textarea', 'text'),
    'common.checkbox': stub('common.checkbox', 'checkbox', 'checkbox'),
    'common.radio': stub('common.radio', 'radio', 'radio'),
    'common.switch': stub('common.switch', 'switch', 'checkbox'),
} as unknown as unstable_SlotMap;

/** A presentation library that renders a distinctive `<input data-stub>` for every routed slot. */
export const stubLibrary: unstable_UiLibrary = unstable_defineUiLibrary({
    id: 'stub-fields',
    displayName: 'Stub fields',
    abi: 1,
    level: 'primitive',
    profile: 'test-controls/v1',
    capabilities: ['slot.render'],
    slots,
});

export const resetSlotCalls = () => {
    Object.keys(slotCalls).forEach((key) => delete slotCalls[key]);
};

/** Wraps children in the stub presentation library. */
export const withStubAdapter = (children: ReactNode) => (
    <CratisComponentsProvider library={stubLibrary}>{children}</CratisComponentsProvider>
);

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { ButtonProps } from '../../Common/Button';
import type { TooltipProps } from '../../Common/Tooltip';
import {
    unstable_defineUiLibrary,
    type unstable_SlotMap,
    type unstable_UiLibrary,
} from '..';

export const FirstButton = (() => <span>first-button</span>) as ComponentType<ButtonProps>;
export const LastButton = (() => <span>last-button</span>) as ComponentType<ButtonProps>;
export const FirstTooltip = (() => <span>first-tooltip</span>) as ComponentType<TooltipProps>;
export const LastTooltip = (() => <span>last-tooltip</span>) as ComponentType<TooltipProps>;

export const buttonSlot = (render: ComponentType<ButtonProps>): unstable_SlotMap => ({
    'common.button': {
        mode: 'presentation',
        fidelity: 'native',
        render,
    },
});

export const tooltipSlot = (render: ComponentType<TooltipProps>): unstable_SlotMap => ({
    'common.tooltip': {
        mode: 'atomic',
        fidelity: 'native',
        render,
    },
});

export const createTestLibrary = (
    id: string,
    slots: unstable_SlotMap,
    overrides: Partial<Omit<unstable_UiLibrary, 'id' | 'slots'>> = {},
): unstable_UiLibrary => unstable_defineUiLibrary({
    displayName: id,
    abi: 1,
    level: 'primitive',
    profile: 'test-controls/v1',
    capabilities: ['slot.render'],
    ...overrides,
    id,
    slots,
});

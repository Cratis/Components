// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeEvent, InputHTMLAttributes } from 'react';
import type {
    CheckboxParts,
    CheckboxProps,
    RadioParts,
    RadioProps,
    SwitchParts,
    SwitchProps,
} from '@cratis/components/Common';
import type { DataAttributes } from './shared.js';

export type ChoiceProps = CheckboxProps | RadioProps | SwitchProps;
export type ChoiceParts = CheckboxParts | RadioParts | SwitchParts;
export type ChoiceKind = 'checkbox' | 'radio' | 'switch';
export type InputPartWithRef = InputHTMLAttributes<HTMLInputElement> &
    DataAttributes & { ref: (input: HTMLInputElement | null) => void };

export interface ChoiceChange {
    readonly checked: boolean;
    readonly originalEvent: ChangeEvent<HTMLInputElement>;
}

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { InputHTMLAttributes, SyntheticEvent } from 'react';
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
export type InputPart = InputHTMLAttributes<HTMLInputElement> & DataAttributes;

export interface PrimeBooleanChangeEvent {
    readonly checked?: boolean;
    readonly value?: boolean;
    readonly originalEvent?: SyntheticEvent;
}

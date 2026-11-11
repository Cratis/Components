// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The state the date picker parts expose as data attributes. */
export interface DatePickerFieldState {
    invalid: boolean;
    disabled: boolean;
    readOnly: boolean;
    selected: boolean;
}

/** State attributes of the picker's outer wrapper. */
export const rootStateAttributes = (state: DatePickerFieldState, isPickerOpen: boolean) => ({
    'data-invalid': state.invalid || undefined,
    'data-disabled': state.disabled || undefined,
    'data-readonly': state.readOnly || undefined,
    'data-open': isPickerOpen || undefined,
    'data-selected': state.selected || undefined,
});

/** State attributes of the segmented group and input. */
export const fieldStateAttributes = (state: DatePickerFieldState, isOpen: boolean) => ({
    'data-open': isOpen || undefined,
    'data-invalid': state.invalid || undefined,
    'data-disabled': state.disabled || undefined,
    'data-readonly': state.readOnly || undefined,
    'data-selected': state.selected || undefined,
});

/** State attributes of the calendar trigger, which is also disabled while read only. */
export const triggerStateAttributes = (state: DatePickerFieldState, isOpen: boolean) => ({
    ...fieldStateAttributes(state, isOpen),
    'data-disabled': state.disabled || state.readOnly || undefined,
});

/** State attributes of one date or time segment. */
export const segmentStateAttributes = (state: DatePickerFieldState) => ({
    'data-invalid': state.invalid || undefined,
    'data-disabled': state.disabled || undefined,
    'data-readonly': state.readOnly || undefined,
});

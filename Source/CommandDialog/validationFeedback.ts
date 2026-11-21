// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CommandFormProps } from '@cratis/arc.react/commands';
import type { DialogRefusalFeedback } from '../Dialogs/DialogRefusalFeedback';

/** The validation results a refused command reports. */
export type CommandValidationResults = Parameters<
    NonNullable<CommandFormProps<object, object>['onValidationFailure']>
>[0];

/** Builds the live-region text announced when submit is blocked by validation. */
export type ValidationAnnouncement = (results: CommandValidationResults) => string;

/**
 * The built-in English announcement: how many problems there are and the first one.
 * @param results The validation results, at least one.
 * @returns The text to announce.
 */
export const defaultValidationAnnouncement: ValidationAnnouncement = (results) =>
    results.length === 1
        ? `There is 1 problem. ${results[0].message}`
        : `There are ${results.length} problems. First: ${results[0].message}`;

const focusableSelector =
    'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Finds the first invalid field in a container: the first element marked `aria-invalid="true"`,
 * or its first focusable descendant when the marked element is a wrapper.
 * @param container The element holding the fields.
 * @returns The element to focus, or `undefined` when there is none.
 */
export const firstInvalidField = (container: HTMLElement | null): HTMLElement | undefined => {
    const invalid = container?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!invalid) return undefined;
    if (invalid.matches(focusableSelector)) return invalid;
    return invalid.querySelector<HTMLElement>(focusableSelector) ?? undefined;
};

/**
 * Describes a refusal caused by validation: the announcement and the field to focus.
 * @param results The validation results of the refused command; empty when it was not refused by validation.
 * @param container The element holding the fields.
 * @param announce Builds the announcement text.
 * @returns The feedback, or `undefined` to keep the dialog's generic refusal behavior.
 */
export const validationRefusalFeedback = (
    results: CommandValidationResults,
    container: HTMLElement | null,
    announce: ValidationAnnouncement = defaultValidationAnnouncement,
): DialogRefusalFeedback | undefined => {
    if (results.length === 0) return undefined;
    return { message: announce(results), focus: firstInvalidField(container) };
};

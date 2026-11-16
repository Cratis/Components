// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type StepperMessages = { stepper?: { next?: string; previous?: string; submit?: string } } | undefined;

interface StepperLabelOverrides {
    nextLabel?: string;
    previousLabel?: string;
    okLabel?: string;
}

/** Resolves the navigation labels: explicit prop, then the provider's message, then the English default. */
export const resolveStepperLabels = (messages: StepperMessages, overrides: StepperLabelOverrides) => ({
    next: overrides.nextLabel ?? messages?.stepper?.next ?? 'Next',
    previous: overrides.previousLabel ?? messages?.stepper?.previous ?? 'Previous',
    ok: overrides.okLabel ?? messages?.stepper?.submit ?? 'Submit',
});

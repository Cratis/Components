// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';

/**
 * Props for {@link StepperPanel}.
 */
export interface StepperPanelProps {
    /**
     * Content shown in the step's header (the label next to the step number).
     * Accepts a string or any node, so a custom/template header works as it did
     * with PrimeReact 10's `StepperPanel`.
     */
    header?: React.ReactNode;
    /** The command form fields that make up this step. */
    children?: React.ReactNode;
}

/**
 * Declares a single step of a {@link CommandStepper} / {@link StepperCommandDialog}
 * wizard. Group the command form fields that belong to a step inside a
 * `<StepperPanel header="…">`; the enclosing stepper reads each panel's
 * `header` and `children` to build the underlying PrimeReact 11 Stepper
 * structure (a `Stepper.Step` in the header list plus a matching
 * `Stepper.Panel` in the content area).
 *
 * This is the Cratis-owned replacement for PrimeReact 10's
 * `primereact/stepperpanel`, which no longer exists in PrimeReact 11. It is a
 * pure marker: it is never rendered on its own — the parent stepper consumes
 * its props — so it renders nothing when mounted directly.
 *
 * ```tsx
 * import { StepperPanel } from '@cratis/components/CommandDialog';
 *
 * <StepperPanel header="Basics">
 *     <InputTextField value={c => c.name} title="Name" />
 * </StepperPanel>
 * ```
 *
 * @param props - {@link StepperPanelProps}.
 */
export const StepperPanel = (_props: StepperPanelProps): React.ReactElement | null => null;
StepperPanel.displayName = 'StepperPanel';

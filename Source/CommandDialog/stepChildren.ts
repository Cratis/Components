// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';

/**
 * Gets the step panels a stepper will actually render, in render order.
 *
 * A conditional step is written as `{condition && <StepperPanel/>}` — which yields
 * `false` when the condition does not hold — and explicit `null` / `undefined` children
 * are just as common. `React.Children.count` counts those, so anything deriving a step
 * count from it believes the wizard has more steps than it renders: navigation runs past
 * the last real panel and the per-step validation gate reads off the end of its array.
 *
 * `React.Children.toArray` already drops `null`, `undefined` and booleans; filtering to
 * valid elements additionally drops bare text children, which are not steps either.
 *
 * Fragments are deliberately **not** flattened — a `<>…</>` wrapping several panels stays
 * one entry, which is the behavior the stepper has always had. Supporting fragments as a
 * container for multiple steps is a separate, additive change.
 *
 * @param children - The stepper children to inspect.
 * @returns The child elements that render as steps.
 */
export function getStepPanels(children: React.ReactNode): React.ReactElement[] {
    return React.Children.toArray(children).filter((child): child is React.ReactElement => React.isValidElement(child));
}

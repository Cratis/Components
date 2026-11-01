// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { componentAttribute } from '../configuration/identity/componentIdentityAttributes';
import { HighlightFrame } from './HighlightFrame';
import type { PickedComponent } from './PickedComponent';

/** Props for {@link ComponentHighlight}. */
export interface ComponentHighlightProps {
    /** The element or picked component to highlight. `null` draws nothing. */
    target: Element | PickedComponent | null;
    /** Overrides the name shown on the highlight. Defaults to the component name. */
    label?: string;
}

/**
 * A passive highlight of a component, for showing what a piece of feedback is about after picking.
 * It never takes focus or pointer input, and is hidden from assistive technology.
 */
export const ComponentHighlight = ({ target, label }: ComponentHighlightProps) => {
    const element = target === null ? null : 'element' in target ? target.element : target;
    const name = label ?? element?.getAttribute(componentAttribute) ?? undefined;
    return <HighlightFrame element={element} label={name} kind='highlight' />;
};

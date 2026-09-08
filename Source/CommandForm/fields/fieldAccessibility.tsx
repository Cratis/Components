// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type ReactNode } from 'react';

/** Accessible identity and description props shared by command-form controls. */
export interface FieldAccessibilityProps {
    /** Stable DOM id for the primary control or semantic group. */
    id?: string;
    /** Explicit accessible name. Falls back to the CommandForm field title. */
    'aria-label'?: string;
    /** Additional description ids supplied by the consumer. */
    'aria-describedby'?: string;
    /** CommandForm field title supplied by Arc's public field props. */
    title?: string;
}

interface FieldAccessibilityFallbacks {
    id?: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
}

interface FieldAccessibilityResult {
    controlId: string;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    hiddenError: ReactNode;
}

/**
 * Associates Arc field titles and validation messages with a Components control.
 * Arc renders the visible title/error presentation; this adds the semantic control
 * name and a visually hidden error description without duplicating visible chrome.
 */
export const useFieldAccessibility = (
    props: FieldAccessibilityProps & { errors: string[] },
    fallbacks: FieldAccessibilityFallbacks = {},
): FieldAccessibilityResult => {
    const generatedId = useId();
    const controlId = props.id ?? fallbacks.id ?? `cratis-field-${generatedId}`;
    const errorId = props.errors.length > 0 ? `${controlId}-errors` : undefined;
    const ariaLabel = props['aria-label'] ?? fallbacks.ariaLabel ?? props.title;
    const ariaDescribedBy = [
        props['aria-describedby'] ?? fallbacks.ariaDescribedBy,
        errorId,
    ]
        .filter(Boolean)
        .join(' ') || undefined;

    return {
        controlId,
        ariaLabel,
        ariaDescribedBy,
        hiddenError: errorId ? (
            <span id={errorId} className='cratis-field-sr-only'>
                {props.errors.join('. ')}
            </span>
        ) : null,
    };
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Chip as PrimeChip } from 'primereact/chip';

/** Props for {@link Chip}. */
export interface ChipProps {
    /** The chip label. */
    label?: string;
    /** An icon rendered before the label. */
    icon?: React.ReactNode;
    /** When true, shows a remove control. */
    removable?: boolean;
    /** Invoked when the remove control is activated. */
    onRemove?: () => void;
    /** Extra class name. */
    className?: string;
}

/**
 * A labeled, optionally-removable chip built on PrimeReact 11's compositional
 * `Chip`. Use for filter pills, selected tokens, and tag-like affordances.
 */
export const Chip = ({ label, icon, removable, onRemove, className }: ChipProps) => (
    <PrimeChip.Root className={className}>
        {icon && <PrimeChip.Start>{icon}</PrimeChip.Start>}
        <PrimeChip.Label>{label}</PrimeChip.Label>
        {removable && (
            <PrimeChip.Remove onClick={onRemove} aria-label="Remove">
                <i className="pi pi-times" />
            </PrimeChip.Remove>
        )}
    </PrimeChip.Root>
);

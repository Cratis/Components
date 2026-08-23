// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

/** Props for {@link Chip}. */
export interface ChipProps {
    /** The chip label. */
    label?: string;
    /** An icon rendered before the label. */
    icon?: ReactNode;
    /** When true, shows a remove control. */
    removable?: boolean;
    /** Invoked when the remove control is activated. */
    onRemove?: () => void;
    /** Accessible name for the remove control. Override to localize. Defaults to `'Remove'`. */
    removeAriaLabel?: string;
    /** Extra class name. */
    className?: string;
}

/** A labeled, optionally removable chip. */
export const Chip = ({ label, icon, removable, onRemove, removeAriaLabel = 'Remove', className }: ChipProps) => (
    <span className={['cratis-chip', className].filter(Boolean).join(' ')} data-cratis-part='root'>
        {icon && <span className='cratis-chip__icon' data-cratis-part='icon'>{icon}</span>}
        <span className='cratis-chip__label' data-cratis-part='label'>{label}</span>
        {removable && (
            <button
                type='button'
                className='cratis-chip__remove'
                data-cratis-part='remove'
                onClick={onRemove}
                aria-label={removeAriaLabel}
            >
                <span aria-hidden='true'>×</span>
            </button>
        )}
    </span>
);

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';

/** Props for {@link ProgressSpinner}. */
export interface ProgressSpinnerProps {
    /** Applied to the spinner root — use it to size the spinner. */
    style?: CSSProperties;
    /** Extra class name applied to the spinner root. */
    className?: string;
    /** Announced to assistive technology while the spinner is visible. */
    'aria-label'?: string;
}

/** An indeterminate loading spinner. */
export const ProgressSpinner = ({ style, className, 'aria-label': ariaLabel = 'Loading' }: ProgressSpinnerProps) => (
    <span
        className={['cratis-progress-spinner', className].filter(Boolean).join(' ')}
        data-cratis-part='root'
        style={style}
        role='status'
        aria-label={ariaLabel}
    >
        <svg className='cratis-progress-spinner__svg' data-cratis-part='svg' viewBox='0 0 50 50' aria-hidden='true'>
            <circle className='cratis-progress-spinner__track' data-cratis-part='track' cx='25' cy='25' r='20' />
            <circle className='cratis-progress-spinner__range' data-cratis-part='range' cx='25' cy='25' r='20' />
        </svg>
    </span>
);

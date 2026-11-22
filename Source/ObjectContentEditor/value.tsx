// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as faIcons from 'react-icons/fa6';
import type { Json } from '../types/JsonSchema';

export function renderValue(
    value: Json,
    propertyName: string,
    pathSegments: string[],
    navigateTo: (segments: string[]) => void,
) {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'object') return String(value);

    const isArray = Array.isArray(value);
    return (
        <button
            type='button'
            className='cratis:flex cratis:items-center cratis:gap-2 cratis:cursor-pointer'
            onClick={() => navigateTo(pathSegments)}
            style={{
                color: 'var(--cratis-primary-color)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                border: 0,
                background: 'transparent',
                font: 'inherit',
            }}
            aria-label={isArray ? `Open ${propertyName}, ${value.length} items` : `Open ${propertyName}`}
        >
            <span>{isArray ? `Array[${value.length}]` : 'Object'}</span>
            <faIcons.FaArrowRight
                style={{ fontSize: '0.875rem', display: 'inline-flex' }}
                aria-hidden='true'
            />
        </button>
    );
}

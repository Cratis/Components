// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';

export const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
    fontSize: '13px',
};

export const rowStyle: CSSProperties = {
    borderBottom: '1px solid var(--cratis-surface-border)',
};

export const labelStyle: CSSProperties = {
    padding: '8px 12px',
    color: 'var(--cratis-text-color-secondary)',
    textAlign: 'left',
    fontWeight: 500,
    width: '140px',
    whiteSpace: 'nowrap',
};

export const valueStyle: CSSProperties = {
    padding: '8px 12px',
    color: 'var(--cratis-text-color)',
    textAlign: 'left',
};

export const infoIconStyle: CSSProperties = {
    fontSize: '0.875rem',
    color: 'var(--cratis-text-color-secondary)',
    flexShrink: 0,
};

export const fieldErrorStyle: CSSProperties = {
    color: 'var(--cratis-red-500)',
    fontSize: '0.75rem',
};

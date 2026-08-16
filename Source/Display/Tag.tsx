// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Tag as PrimeTag } from 'primereact/tag';

/** Severity tone of a {@link Tag}. */
export type TagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';

/** Props for {@link Tag}. */
export interface TagProps {
    /** The label shown inside the tag. */
    value?: React.ReactNode;
    /** Severity tone (drives the color). */
    severity?: TagSeverity;
    /** When true, fully rounds the tag. */
    rounded?: boolean;
    /** An icon rendered before the label. */
    icon?: React.ReactNode;
    /** Extra class name. */
    className?: string;
    /** Tag content (alternative to {@link value}). */
    children?: React.ReactNode;
}

/**
 * A small colored status label built on PrimeReact 11's `Tag`. Use for inline
 * status indicators in tables, lists, and detail views — e.g. an order state
 * or a read-model flag.
 */
export const Tag = ({ value, severity, rounded, icon, className, children }: TagProps) => (
    <PrimeTag severity={severity} rounded={rounded} className={className} data-severity={severity}>
        {icon}
        {value ?? children}
    </PrimeTag>
);

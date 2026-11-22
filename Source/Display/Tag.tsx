// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { IconDisplay } from '../Common/Icon';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Severity tone of a {@link Tag}. */
export type TagSeverity =
    'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';

/** Props for {@link Tag}. */
export interface TagProps {
    /** The label shown inside the tag. */
    value?: ReactNode;
    /** Severity tone (drives the color). */
    severity?: TagSeverity;
    /** When true, fully rounds the tag. */
    rounded?: boolean;
    /**
     * An icon rendered before the label. A string is treated as a complete consumer-owned
     * icon-font CSS class; any other React node is rendered as supplied.
     */
    icon?: ReactNode;
    /** Extra class name. */
    className?: string;
    /** Tag content (alternative to {@link value}). */
    children?: ReactNode;
}

const tagDescriptor = describeComponent<TagProps>('Tag', [
    { name: 'severity', label: 'Severity', type: 'enum', values: ['secondary', 'success', 'info', 'warn', 'danger', 'contrast'] satisfies NonNullable<TagProps['severity']>[], defaultValue: 'secondary' },
    { name: 'rounded', label: 'Rounded', type: 'boolean' },
]);

/** A small colored status label. */
export const Tag = (props: TagProps) => {
    const [presentation, marker] = useComponentPresentation(tagDescriptor, props);
    const { value, severity = 'secondary', rounded, icon, className, children } = presentation;
    return (
        <span
            {...marker}
            className={['cratis-tag', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-severity={severity}
            data-rounded={rounded || undefined}
        >
            {icon && (
                <span className='cratis-tag__icon' data-cratis-part='icon'>
                    <IconDisplay icon={icon} />
                </span>
            )}
            <span className='cratis-tag__label' data-cratis-part='label'>
                {value ?? children}
            </span>
        </span>
    );
};

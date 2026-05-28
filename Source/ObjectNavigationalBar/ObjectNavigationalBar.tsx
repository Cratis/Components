// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import { Button } from 'primereact/button';
import * as faIcons from 'react-icons/fa6';
import { buildNavigationBreadcrumbs } from './breadcrumbHelpers';
import './ObjectNavigationalBar.css';

/**
 * Props for {@link ObjectNavigationalBar}.
 */
export interface ObjectNavigationalBarProps {
    /**
     * Ordered list of property keys representing the current navigation depth
     * into a nested object (e.g. `['shipping', 'address']`). An empty array
     * means the navigation bar is at the root.
     */
    navigationPath: string[];

    /**
     * Invoked when the user clicks a breadcrumb or the back arrow. Receives
     * the destination index in {@link navigationPath} (`0` means root).
     */
    onNavigate: (index: number) => void;

    /** Extra CSS class names appended to the navigation bar root. */
    className?: string;
}

/**
 * Breadcrumb-style navigation bar showing the user's path through a nested
 * object structure, with a back-arrow button and clickable breadcrumb
 * segments. Pairs with {@link ObjectContentEditor} but can be reused for any
 * tree-like data exploration UI.
 *
 * @param props - {@link ObjectNavigationalBarProps}.
 */
export function ObjectNavigationalBar({ navigationPath, onNavigate, className }: ObjectNavigationalBarProps) {
    const breadcrumbItems = useMemo(() => buildNavigationBreadcrumbs(navigationPath), [navigationPath]);
    const rootClassName = className
        ? `cratis-object-navigational-bar px-4 py-2 mb-2 ${className}`
        : 'cratis-object-navigational-bar px-4 py-2 mb-2';

    return (
        <div className={rootClassName}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                    icon={<faIcons.FaArrowLeft />}
                    text
                    size="small"
                    onClick={() => onNavigate(navigationPath.length - 1)}
                    tooltip="Navigate back"
                    tooltipOptions={{ position: 'top' }}
                    disabled={navigationPath.length === 0}
                />
                <div style={{ fontSize: '0.9rem', color: 'var(--cratis-text-color-secondary)' }}>
                    {breadcrumbItems.map((item, index) => (
                        <span key={index}>
                            {index > 0 && <span className="mx-2">&gt;</span>}
                            <span
                                onClick={() => onNavigate(item.index)}
                                style={{
                                    cursor: 'pointer',
                                    textDecoration: index < breadcrumbItems.length - 1 ? 'underline' : 'none'
                                }}
                            >
                                {item.name}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import { Button } from '../Common/Button';
import * as faIcons from 'react-icons/fa6';
import { Tooltip } from '../Common/Tooltip';
import { buildNavigationBreadcrumbs } from './breadcrumbHelpers';

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

    /** Label and accessible name for the back button (tooltip + aria-label). Override to localize. Defaults to `'Navigate back'`. */
    backLabel?: string;

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
export function ObjectNavigationalBar({
    navigationPath,
    onNavigate,
    backLabel = 'Navigate back',
    className,
}: ObjectNavigationalBarProps) {
    const breadcrumbItems = useMemo(
        () => buildNavigationBreadcrumbs(navigationPath),
        [navigationPath],
    );
    const rootClassName = className
        ? `cratis-object-navigational-bar cratis:px-4 cratis:py-2 cratis:mb-2 ${className}`
        : 'cratis-object-navigational-bar cratis:px-4 cratis:py-2 cratis:mb-2';

    return (
        <div className={rootClassName}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tooltip content={backLabel} position='top'>
                    <Button
                        text
                        size='small'
                        icon={<faIcons.FaArrowLeft />}
                        onClick={() => onNavigate(navigationPath.length - 1)}
                        disabled={navigationPath.length === 0}
                        aria-label={backLabel}
                    />
                </Tooltip>
                <div
                    style={{
                        fontSize: '0.9rem',
                        color: 'var(--cratis-text-color-secondary)',
                    }}
                >
                    {breadcrumbItems.map((item, index) => (
                        <span key={index}>
                            {index > 0 && <span className='cratis:mx-2'>&gt;</span>}
                            <button
                                type='button'
                                onClick={() => onNavigate(item.index)}
                                aria-current={
                                    index === breadcrumbItems.length - 1
                                        ? 'location'
                                        : undefined
                                }
                                style={{
                                    padding: 0,
                                    border: 0,
                                    background: 'transparent',
                                    color: 'inherit',
                                    font: 'inherit',
                                    cursor: 'pointer',
                                    textDecoration:
                                        index < breadcrumbItems.length - 1
                                            ? 'underline'
                                            : 'none',
                                }}
                            >
                                {item.name}
                            </button>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

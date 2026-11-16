// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as faIcons from 'react-icons/fa6';
import { Button } from '../Common/Button';
import { Tooltip } from '../Common/Tooltip';
import type { NavigationItem } from '../types/JsonSchema';

/** Props of the table layout's navigation bar. */
export interface SchemaEditorNavigationProps {
    items: NavigationItem[];
    description?: string;
    isAtRoot: boolean;
    navigateBackLabel: string;
    onNavigateBack: () => void;
    onNavigateToBreadcrumb: (index: number) => void;
}

const breadcrumbButtonStyle = (isCurrent: boolean) =>
    ({
        padding: 0,
        border: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
        textDecoration: isCurrent ? 'none' : 'underline',
    }) as const;

const descriptionStyle = {
    fontSize: '0.875rem',
    color: 'var(--cratis-text-color-secondary)',
    marginTop: '0.5rem',
    marginLeft: '2.5rem',
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
} as const;

const Breadcrumb = ({
    items,
    onNavigateToBreadcrumb,
}: Pick<SchemaEditorNavigationProps, 'items' | 'onNavigateToBreadcrumb'>) => (
    <div
        style={{
            fontSize: '0.9rem',
            color: 'var(--cratis-text-color-secondary)',
            cursor: 'pointer',
        }}
    >
        {items.map((item, index) => {
            const isCurrent = index === items.length - 1;
            return (
                <span key={index}>
                    {index > 0 && <span className='cratis:mx-2'>&gt;</span>}
                    <button
                        type='button'
                        onClick={() => onNavigateToBreadcrumb(index)}
                        aria-current={isCurrent ? 'location' : undefined}
                        style={breadcrumbButtonStyle(isCurrent)}
                    >
                        {item.name}
                    </button>
                </span>
            );
        })}
    </div>
);

/** The back button, breadcrumb trail and description of the schema level being edited. */
export const SchemaEditorNavigation = ({
    items,
    description,
    isAtRoot,
    navigateBackLabel,
    onNavigateBack,
    onNavigateToBreadcrumb,
}: SchemaEditorNavigationProps) => (
    <div className='cratis:px-4 cratis:py-2 cratis-schema-editor-bottom-border'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tooltip content={navigateBackLabel} position='top'>
                <Button
                    variant='ghost'
                    size='small'
                    icon={<faIcons.FaArrowLeft />}
                    onClick={onNavigateBack}
                    disabled={isAtRoot}
                    aria-label={navigateBackLabel}
                />
            </Tooltip>
            <Breadcrumb items={items} onNavigateToBreadcrumb={onNavigateToBreadcrumb} />
        </div>
        {description && (
            <div style={descriptionStyle}>
                <faIcons.FaCircleInfo />
                <span>{description}</span>
            </div>
        )}
    </div>
);

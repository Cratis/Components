// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as faIcons from 'react-icons/fa6';
import type { JsonSchemaProperty } from '../types/JsonSchema';

const NavigationArrow = () => (
    <>
        <div style={{ flex: 1 }} />
        <span style={{ display: 'flex', alignItems: 'center' }}>
            <faIcons.FaArrowRight
                style={{
                    fontSize: '1rem',
                    color: 'var(--cratis-primary-color)',
                }}
            />
        </span>
    </>
);

interface ContainerViewProps {
    title: string | undefined;
    text: string;
    navigable: boolean;
}

const ContainerView = ({ title, text, navigable }: ContainerViewProps) => (
    <div
        className='cratis:flex cratis:items-center cratis:gap-2 cratis:w-full'
        style={{ height: '100%' }}
        title={title}
    >
        <span>{text}</span>
        {navigable && <NavigationArrow />}
    </div>
);

/** The read-only view of an array or object type: a label that offers navigation when there is something to navigate to. */
export const ReadOnlyContainerType = ({ rowData }: { rowData: JsonSchemaProperty }) => {
    if (rowData.type === 'object') {
        return <ContainerView title='Click to navigate to object properties' text='Object' navigable />;
    }
    const itemType = rowData.items?.type || 'string';
    const isNavigable = itemType === 'object';
    return (
        <ContainerView
            title={isNavigable ? 'Click to navigate to item definition' : undefined}
            text={`Array of ${itemType}`}
            navigable={isNavigable}
        />
    );
};

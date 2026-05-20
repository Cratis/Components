// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { formatPropertyName } from './propertiesHelpers';
import './Properties.css';

interface PropertiesProps {
    data: Record<string, unknown>;
    /** CSS class name for the container */
    className?: string;
    /** Text alignment for the table */
    align?: 'left' | 'right';
}

export const Properties: React.FC<PropertiesProps> = ({ data, className, align = 'left' }) => {
    const isRight = align === 'right';

    const renderValue = (value: unknown): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span className="tm-properties-null">null</span>;
        }

        if (typeof value === 'boolean') {
            return <span className={value ? 'tm-properties-boolean-true' : 'tm-properties-boolean-false'}>{value.toString()}</span>;
        }

        if (typeof value === 'number') {
            return <span className="tm-properties-number">{value}</span>;
        }

        if (value instanceof Date) {
            return <span className="tm-properties-date">{value.toLocaleString()}</span>;
        }

        if (Array.isArray(value)) {
            return (
                <span className="tm-properties-complex">
                    Array[{value.length}]
                </span>
            );
        }

        if (typeof value === 'object') {
            return (
                <span className="tm-properties-complex">
                    {'{'}...{'}'}
                </span>
            );
        }

        return <span>{String(value)}</span>;
    };

    return (
        <div className={className}>
            <table className="tm-properties-table">
                <tbody>
                    {data && Object.entries(data).map(([key, value], index) => (
                        <tr key={`${key}-${index}`} className="tm-properties-row">
                            <td className={`tm-properties-label${isRight ? ' tm-properties-label--right' : ''}`}>{formatPropertyName(key)}</td>
                            <td className={`tm-properties-value${isRight ? ' tm-properties-value--right' : ''}`}>{renderValue(value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


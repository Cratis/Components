// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import React from 'react';

interface PropertiesProps {
    data: Record<string, unknown>;
    /** CSS class name for the container */
    className?: string;
    /** Text alignment for the table */
    align?: 'left' | 'right';
}

export const Properties: React.FC<PropertiesProps> = ({ data, className, align = 'left' }) => {
    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
        fontSize: '13px',
    };

    const rowStyle: React.CSSProperties = {
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    };

    const labelStyle: React.CSSProperties = {
        padding: '8px 12px',
        color: 'rgba(255,255,255,0.6)',
        textAlign: align,
        fontWeight: 500,
        width: '40%',
    };

    const valueStyle: React.CSSProperties = {
        padding: '8px 12px',
        color: '#fff',
        textAlign: align,
    };

    const renderValue = (value: unknown): React.ReactNode => {
        if (value === null || value === undefined) {
            return <span style={{ color: 'rgba(255,255,255,0.4)' }}>null</span>;
        }

        if (typeof value === 'boolean') {
            return <span style={{ color: value ? '#4ade80' : '#f87171' }}>{value.toString()}</span>;
        }

        if (typeof value === 'number') {
            return <span style={{ color: '#fbbf24' }}>{value}</span>;
        }

        if (value instanceof Date) {
            return <span style={{ color: '#60a5fa' }}>{value.toLocaleString()}</span>;
        }

        if (Array.isArray(value)) {
            return (
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Array[{value.length}]
                </span>
            );
        }

        if (typeof value === 'object') {
            return (
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {'{'}...{'}'}
                </span>
            );
        }

        return <span>{String(value)}</span>;
    };

    const formatPropertyName = (key: string): string => {
        // Convert camelCase to Title Case with spaces
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    return (
        <div className={className}>
            <table style={tableStyle}>
                <tbody>
                    {data && Object.entries(data).map(([key, value], index) => (
                        <tr key={`${key}-${index}`} style={rowStyle}>
                            <td style={labelStyle}>{formatPropertyName(key)}</td>
                            <td style={valueStyle}>{renderValue(value)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

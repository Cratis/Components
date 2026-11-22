// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Fragment } from 'react';
import type { Json } from '../types/JsonSchema';
import { labelStyle, rowStyle, tableStyle, valueStyle } from './styles';
import { renderValue } from './value';

function renderObjectArray(data: Json[], keys: string[], navigateTo: (segments: string[]) => void) {
    return (
        <table style={tableStyle}>
            <tbody>
                {data.map((item, index) => (
                    <Fragment key={index}>
                        {index > 0 && (
                            <tr style={{ height: '8px', background: 'var(--cratis-surface-hover)' }}>
                                <td colSpan={2}></td>
                            </tr>
                        )}
                        {keys.map((key) => (
                            <tr key={`${index}-${key}`} style={rowStyle}>
                                <td style={labelStyle}>{key}</td>
                                <td style={valueStyle}>
                                    {renderValue(
                                        (item as Record<string, Json>)[key],
                                        key,
                                        [String(index), key],
                                        navigateTo,
                                    )}
                                </td>
                            </tr>
                        ))}
                    </Fragment>
                ))}
            </tbody>
        </table>
    );
}

function renderPrimitiveArray(data: Json[], navigateTo: (segments: string[]) => void) {
    return (
        <table style={tableStyle}>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} style={rowStyle}>
                        <td style={labelStyle}>[{index}]</td>
                        <td style={valueStyle}>
                            {renderValue(item, `[${index}]`, [String(index)], navigateTo)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function renderArrayTable(data: Json[], navigateTo: (segments: string[]) => void) {
    if (data.length === 0) {
        return (
            <div style={{ padding: '12px', color: 'var(--cratis-text-color-secondary)' }}>
                Empty array
            </div>
        );
    }
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
        return renderObjectArray(data, Object.keys(firstItem), navigateTo);
    }
    return renderPrimitiveArray(data, navigateTo);
}

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ComponentType, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TableRendererProps } from '../../TableRenderer';

/** A trivial row type for the bring-your-own-renderer proof. */
export interface Row {
    id: number;
    name: string;
}

/**
 * A trivial, non-`DataTableCore` table renderer: a plain unordered list with no
 * PrimeReact anywhere. Generic over the row type exactly like `DataTableCore`,
 * so it plugs into `bindQuery`. Its `byo-list` / `byo-empty` class names are
 * markers the specs assert on to prove the consumer's *own* rendering is what
 * shows up, driven by Cratis's paged query data.
 */
export const ListRenderer = <TData extends object,>({ data, emptyMessage }: TableRendererProps<TData>): ReactElement => {
    if (data.length === 0) {
        return <p className="byo-empty">{emptyMessage}</p>;
    }
    return (
        <ul className="byo-list">
            {data.map((row, index) => (
                <li key={index}>{JSON.stringify(row)}</li>
            ))}
        </ul>
    );
};

/**
 * A stand-in query constructor. The Arc query hook is mocked in each spec, so
 * this is never executed — it only satisfies the bound component's `query` prop.
 */
export class FakeRowsQuery { }

/** Renders a query-bound table to static markup, supplying the stand-in query. */
export const renderBoundTable = (Bound: unknown, props: { emptyMessage: string; dataKey?: string }): string =>
    renderToStaticMarkup(
        React.createElement(
            Bound as ComponentType<{ query: unknown; emptyMessage: string; dataKey?: string }>,
            { query: FakeRowsQuery, ...props }
        )
    );

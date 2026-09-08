// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { CSSProperties, ReactNode } from 'react';

/**
 * Props for {@link DataPageLayout}.
 */
export interface DataPageLayoutProps {
    /** The `<DataPage.MenuItems>` and `<DataPage.Columns>` content to lay out. */
    children: ReactNode;
}

/**
 * The layout root's own style. Declared inline rather than in a stylesheet on
 * purpose: a consumer that never imports a stylesheet from this package still
 * has to get a working page out of `DataPage`, and the height allocation is
 * what the whole component depends on.
 *
 * `minHeight: 0` is what lets the column shrink inside the flex parent that
 * `Page` renders — without it the default `min-height: auto` keeps the column
 * at content height and everything below the available space is clipped.
 */
const layoutStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0
};

/**
 * The vertical layout inside a `DataPage`'s primary pane.
 *
 * It is a definite-height flex column, so the action bar can be an intrinsic
 * item while the table region absorbs whatever height is left. That is what
 * keeps the table's own paginator inside the page instead of pushing it past
 * the bottom edge, where the surrounding `overflow: hidden` clips it away.
 *
 * @param props - {@link DataPageLayoutProps}.
 */
export const DataPageLayout = ({ children }: DataPageLayoutProps) => (
    <div className='cratis-data-page-layout' style={layoutStyle}>
        {children}
    </div>
);

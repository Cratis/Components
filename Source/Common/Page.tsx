// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { HTMLAttributes, ReactNode } from 'react';

/**
 * Props for {@link Page}. Extends the standard `div` attributes so callers can
 * forward `id`, `aria-*`, `data-*`, custom styles, and event handlers to the
 * root element.
 */
export interface PageProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Title of the page. Always passed in; only rendered when {@link showTitle}
     * is true, but kept on every page so it's available for browser tab titles
     * and accessibility tooling.
     */
    title: string;

    /**
     * When true, renders the title as a level-1 heading at the top of the page.
     * Defaults to `false` because many pages use a custom header or breadcrumb
     * trail rendered inside `children` instead.
     */
    showTitle?: boolean;

    /** Page body content. */
    children?: ReactNode;

    /**
     * When true, wraps the body in a "panel" container that applies the
     * surface, border, and radius styling defined by the `--cratis-*` tokens.
     * Useful when the page is the sole occupant of a viewport region.
     */
    panel?: boolean
}

/**
 * Top-level page layout primitive. Renders a flex column that fills its parent
 * vertically, with optional title heading and optional `panel` chrome around
 * the main content area. Intended as the root element of every routable view.
 *
 * ```tsx
 * <Page title="Authors" showTitle panel>
 *     <AuthorList />
 * </Page>
 * ```
 *
 * @param props - {@link PageProps}.
 */
export const Page = ({ title, showTitle = false, children, panel, ...rest }: PageProps) => {
    return (
        <div className='cratis:flex cratis:flex-col cratis:h-full cratis:flex-1' {...rest}>
            {showTitle && <h1 className='cratis:text-3xl cratis:mt-3 cratis:mb-4'>{title}</h1>}
            <main className={`cratis:overflow-hidden cratis:h-full cratis:flex cratis:flex-col cratis:flex-1 ${panel ? 'panel' : ''}`}>
                {children}
            </main>
        </div>
    );
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { HTMLAttributes, ReactNode } from 'react';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

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
     * When true, adds a `panel` class to the main content region for the
     * application's own CSS. Page applies no panel styling itself.
     */
    panel?: boolean
}

/** Presentation props of {@link Page}. */
const pageDescriptor = describeComponent<PageProps>('Page', [
    { name: 'title', label: 'Title', type: 'string', description: 'The page title, shown when showTitle is on.' },
    { name: 'showTitle', label: 'Show title', type: 'boolean', defaultValue: false },
    { name: 'panel', label: 'Panel', type: 'boolean', defaultValue: false },
]);

/**
 * Top-level page layout primitive. Renders a flex column that fills its parent
 * vertically, with an optional title heading and a `panel` class hook on the
 * main content area. Intended as the root element of every routable view.
 *
 * ```tsx
 * <Page title="Authors" showTitle panel>
 *     <AuthorList />
 * </Page>
 * ```
 *
 * @param props - {@link PageProps}.
 */
export const Page = (incomingProps: PageProps) => {
    const [props, marker] = useComponentPresentation(pageDescriptor, incomingProps, incomingProps.id);
    const { title, showTitle = false, children, panel, className, ...rest } = props;
    return (
        <div {...marker} className={`cratis:flex cratis:flex-col cratis:h-full cratis:flex-1${className ? ` ${className}` : ''}`} {...rest}>
            {showTitle && <h1 className='cratis:text-3xl cratis:mt-3 cratis:mb-4'>{title}</h1>}
            <main className={`cratis:overflow-hidden cratis:h-full cratis:flex cratis:flex-col cratis:flex-1 ${panel ? 'panel' : ''}`}>
                {children}
            </main>
        </div>
    );
};

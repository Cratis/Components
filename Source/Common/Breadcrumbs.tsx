// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type HTMLAttributes, type ReactNode } from 'react';
import {
    Breadcrumb as AriaBreadcrumb,
    Breadcrumbs as AriaBreadcrumbs,
    Link as AriaLink,
} from 'react-aria-components/Breadcrumbs';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Attributes a consumer may hand to one {@link Breadcrumbs} part: class, style, title and data attributes. */
export type BreadcrumbsPartAttributes = Pick<
    HTMLAttributes<HTMLElement>,
    'className' | 'style' | 'title'
> & {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** One segment of a {@link Breadcrumbs} trail. */
export interface BreadcrumbItem {
    /** Visible label. */
    label: ReactNode;
    /** Destination. A segment without one is text rather than a link — as the last segment is. */
    href?: string;
    /** Called instead of navigating, for a router that owns navigation. */
    onNavigate?: () => void;
}

/** Stable Cratis-owned parts for styling a {@link Breadcrumbs} trail. */
export interface BreadcrumbsParts {
    /** The navigation landmark wrapping the trail. */
    root?: BreadcrumbsPartAttributes;
    /** One segment. */
    item?: BreadcrumbsPartAttributes;
    /** A segment's link, rendered for every segment that is not the current page. */
    link?: BreadcrumbsPartAttributes;
    /** The separator between two segments. */
    separator?: BreadcrumbsPartAttributes;
}

const breadcrumbsPartsMatchManifest: ExactPartKeys<
    BreadcrumbsParts,
    PartsOf<'Breadcrumbs'>
> = true;
void breadcrumbsPartsMatchManifest;

/** Props for {@link Breadcrumbs}. */
export interface BreadcrumbsProps {
    /** The trail, outermost first. The last item is the current page. */
    items: BreadcrumbItem[];
    /** Separator rendered between segments. Defaults to a slash; decorative either way. */
    separator?: ReactNode;
    /** Accessible name for the landmark. Name it when a page carries more than one trail. */
    'aria-label'?: string;
    /** Extra class name for the root element. */
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: BreadcrumbsParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * A breadcrumb trail.
 *
 * The last segment is the current page: it carries `aria-current="page"` and is never a link, which
 * is what tells a screen-reader user where the trail ends. Earlier segments are links when they have
 * a destination. The trail is an ordered list inside a navigation landmark, so it can be jumped to
 * and its length announced.
 */
export const Breadcrumbs = ({
    items,
    separator = '/',
    'aria-label': ariaLabel,
    className,
    pt,
}: BreadcrumbsProps) => (
    // React Aria renders the ordered list; the navigation landmark around it is ours, because a
    // trail a screen-reader user cannot jump to is only a list of links.
    <nav aria-label={ariaLabel}>
        <AriaBreadcrumbs
            {...pt?.root}
            className={classNames('cratis-breadcrumbs', pt?.root?.className, className)}
            data-cratis-part='root'
        >
        {items.map((item, index) => {
            const current = index === items.length - 1;
            return (
                <AriaBreadcrumb
                    key={`${index}-${String(item.href ?? '')}`}
                    {...pt?.item}
                    className={classNames('cratis-breadcrumbs__item', pt?.item?.className)}
                    data-cratis-part='item'
                    data-selected={current || undefined}
                >
                    {/*
                      * Every segment is a link, including the current page: React Aria hands
                      * aria-current="page" and the disabled state to the last one through its link
                      * context, so a segment rendered as plain text would silently lose both.
                      */}
                    <AriaLink
                        {...pt?.link}
                        href={current ? undefined : item.href}
                        onPress={current ? undefined : item.onNavigate}
                        className={classNames(
                            'cratis-breadcrumbs__link',
                            pt?.link?.className,
                        )}
                        data-cratis-part='link'
                        data-selected={current || undefined}
                    >
                        {item.label}
                    </AriaLink>
                    {!current && (
                        <span
                            {...pt?.separator}
                            aria-hidden='true'
                            className={classNames(
                                'cratis-breadcrumbs__separator',
                                pt?.separator?.className,
                            )}
                            data-cratis-part='separator'
                        >
                            {separator}
                        </span>
                    )}
                </AriaBreadcrumb>
                );
            })}
        </AriaBreadcrumbs>
    </nav>
);

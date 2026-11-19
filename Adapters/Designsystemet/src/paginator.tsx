// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, type FocusEventHandler, type ReactNode, type RefObject } from 'react';
import { Pagination } from '@digdir/designsystemet-react';
import { paginatorPages, type TablePaginatorProps } from '@cratis/components/DataTables';
import type { ButtonParts } from '@cratis/components/Common';
import { classNames } from './classNames.js';
import { currentPageStyle, pagesGroupStyle, rangeReport, useLabels } from './paginatorLabels.js';

type ControlName = 'first' | 'previous' | 'next' | 'last';

// Paging to either end disables the control that was just activated, which would drop keyboard
// focus to the page body. Keep it inside the paginator, on the nearest enabled control.
const lostFocus = (control: HTMLElement | null): control is HTMLElement =>
    control !== null && document.activeElement === control && (control as HTMLButtonElement).disabled;

const useFocusKeeper = (rootRef: RefObject<HTMLDivElement | null>, isFirst: boolean, isLast: boolean) => {
    const focusedControl = useRef<HTMLElement | null>(null);
    useLayoutEffect(() => {
        const control = focusedControl.current;
        if (!lostFocus(control)) return;
        const buttons = [...(rootRef.current?.querySelectorAll('button') ?? [])];
        const index = buttons.indexOf(control as HTMLButtonElement);
        const candidates = isLast ? buttons.slice(0, index).reverse() : buttons.slice(index + 1);
        candidates.find((button) => !button.disabled)?.focus();
    }, [rootRef, isFirst, isLast]);
    return (element: HTMLElement) => {
        focusedControl.current = element;
    };
};

interface ControlProps {
    readonly name: ControlName;
    readonly label: string;
    readonly parts: ButtonParts | undefined;
    readonly disabled: boolean;
    readonly onActivate: () => void;
    readonly children: ReactNode;
}

const Control = ({ name, label, parts, disabled, onActivate, children }: ControlProps) => (
    <Pagination.Button
        variant='tertiary'
        {...parts?.root}
        type='button'
        aria-label={label}
        disabled={disabled}
        onClick={onActivate}
        className={classNames('cratis-designsystemet-paginator__control', parts?.root?.className)}
        data-cratis-part={name}
    >
        {children}
    </Pagination.Button>
);

type Parts = TablePaginatorProps['pt'];

const Ellipsis = ({ pt }: { readonly pt: Parts }) => (
    <span
        {...pt?.ellipsis}
        aria-hidden='true'
        className={classNames('cratis-designsystemet-paginator__ellipsis', pt?.ellipsis?.className)}
        data-cratis-part='ellipsis'
    >
        …
    </span>
);

interface PageItemProps {
    readonly number: number;
    readonly current: boolean;
    readonly label: string;
    readonly pt: Parts;
    readonly onSelect: () => void;
}

const PageItem = ({ number, current, label, pt, onSelect }: PageItemProps) => {
    const part = pt?.page ?? {};
    return (
        <Pagination.Button
            variant='tertiary'
            {...part}
            type='button'
            aria-label={label}
            aria-current={current ? 'page' : undefined}
            style={current ? { ...currentPageStyle, ...part.style } : part.style}
            className={classNames('cratis-designsystemet-paginator__page', part.className)}
            data-selected={current || undefined}
            data-cratis-part='page'
            onClick={onSelect}
        >
            {number}
        </Pagination.Button>
    );
};

const RangeReport = ({ text, pt }: { readonly text: string | undefined; readonly pt: Parts }) =>
    text ? (
        <span {...pt?.range} className={classNames('cratis-table-paginator-range', pt?.range?.className)} data-cratis-part='range'>
            {text}
        </span>
    ) : null;

const PageInfo = ({ page, pageCount, pt }: { readonly page: number; readonly pageCount: number; readonly pt: Parts }) => (
    <Pagination.Item>
        <span {...pt?.info} className={classNames('cratis-table-paginator-info', pt?.info?.className)} data-cratis-part='info'>
            {page + 1} / {Math.max(pageCount, 1)}
        </span>
    </Pagination.Item>
);

type PageEntry = ReturnType<typeof paginatorPages>[number];

interface PageListItemProps {
    readonly item: PageEntry;
    readonly page: number;
    readonly pageLabel: (page: number) => string;
    readonly pt: Parts;
    readonly onPageChange: (page: number) => void;
}

const PageListItem = ({ item, page, pageLabel, pt, onPageChange }: PageListItemProps) =>
    item.kind === 'ellipsis' ? (
        <Ellipsis pt={pt} />
    ) : (
        <PageItem
            number={item.page + 1}
            current={item.page === page}
            label={pageLabel(item.page + 1)}
            pt={pt}
            onSelect={() => onPageChange(item.page)}
        />
    );

const itemKey = (item: PageEntry) => (item.kind === 'ellipsis' ? item.key : item.page);

const PageList = ({
    page,
    pageCount,
    pageLinks,
    onPageChange,
    pt,
    pageLabel,
    pagesLabel,
}: TablePaginatorProps & {
    readonly pageLabel: (page: number) => string;
    readonly pagesLabel: string;
}) => {
    const options = typeof pageLinks === 'object' ? pageLinks : undefined;
    const group = pt?.pages;
    // Same semantics as the built-in paginator: the numbered pages form one labelled group.
    return (
        <Pagination.Item>
            <div
                {...group}
                style={{ ...pagesGroupStyle, ...group?.style }}
                role='group'
                aria-label={pagesLabel}
                className={classNames('cratis-designsystemet-paginator__pages', group?.className)}
                data-cratis-part='pages'
            >
                {paginatorPages(page, pageCount, options?.siblings, options?.boundaries).map((item) => (
                    <PageListItem key={itemKey(item)} item={item} page={page} pageLabel={pageLabel} pt={pt} onPageChange={onPageChange} />
                ))}
            </div>
        </Pagination.Item>
    );
};

interface PaginatorControlProps {
    readonly name: ControlName;
    readonly labels: ReturnType<typeof useLabels>;
    readonly pt: Parts;
    readonly disabled: boolean;
    readonly target: number;
    readonly onPageChange: (page: number) => void;
    readonly children: ReactNode;
}

const PaginatorControl = ({ name, labels, pt, disabled, target, onPageChange, children }: PaginatorControlProps) => (
    <Control name={name} label={labels[name]} parts={pt?.[name]} disabled={disabled} onActivate={() => onPageChange(target)}>
        {children}
    </Control>
);

// Remembers the focused control for the focus keeper, then forwards the event to any part handler.
const composeFocus =
    (remember: (element: HTMLElement) => void, forward: FocusEventHandler<HTMLDivElement> | undefined): FocusEventHandler<HTMLDivElement> =>
    (event) => {
        remember(event.target);
        forward?.(event);
    };

/** Designsystemet implementation of the stable atomic `datatables.paginator` slot. */
export const DesignsystemetPaginatorSlot = (props: TablePaginatorProps) => {
    const { page, pageCount, onPageChange, pageLinks = false, className, pt } = props;
    const labels = useLabels(props);
    const rootRef = useRef<HTMLDivElement>(null);
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;
    const rememberFocus = useFocusKeeper(rootRef, isFirst, isLast);
    const range = rangeReport(props, labels.range);
    const control = { labels, pt, onPageChange };
    return (
        <Pagination asChild>
            <div
                {...pt?.root}
                ref={rootRef}
                role='navigation'
                aria-label={labels.navigation}
                onFocus={composeFocus(rememberFocus, pt?.root?.onFocus)}
                className={classNames('cratis-designsystemet-paginator', 'cratis-table-paginator', pt?.root?.className, className)}
                data-cratis-part='root'
                data-cratis-component='TablePaginator'
            >
                <RangeReport text={range} pt={pt} />
                <PaginatorControl {...control} name='first' disabled={isFirst} target={0}>
                    <span aria-hidden='true'>«</span>
                </PaginatorControl>
                <Pagination.List>
                    <Pagination.Item>
                        <PaginatorControl {...control} name='previous' disabled={isFirst} target={page - 1}>
                            {labels.previous}
                        </PaginatorControl>
                    </Pagination.Item>
                    {pageLinks ? (
                        <PageList {...props} pageLabel={labels.page} pagesLabel={labels.pages} />
                    ) : (
                        <PageInfo page={page} pageCount={pageCount} pt={pt} />
                    )}
                    <Pagination.Item>
                        <PaginatorControl {...control} name='next' disabled={isLast} target={page + 1}>
                            {labels.next}
                        </PaginatorControl>
                    </Pagination.Item>
                </Pagination.List>
                <PaginatorControl {...control} name='last' disabled={isLast} target={pageCount - 1}>
                    <span aria-hidden='true'>»</span>
                </PaginatorControl>
            </div>
        </Pagination>
    );
};

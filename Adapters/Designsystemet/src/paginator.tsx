// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Pagination } from '@digdir/designsystemet-react';
import { useCratisComponentsConfig } from '@cratis/components';
import { paginatorPages, type TablePaginatorProps } from '@cratis/components/DataTables';
import type { ButtonParts } from '@cratis/components/Common';
import { classNames } from './classNames.js';

type ControlName = 'first' | 'previous' | 'next' | 'last';

// Designsystemet styles a current page only through aria-current="true"; the accessible
// aria-current="page" is kept, so the filled look is supplied through the same button tokens.
const currentPageStyle = {
    '--dsc-button-background': 'var(--ds-color-base-default)',
    '--dsc-button-background--hover': 'var(--ds-color-base-hover)',
    '--dsc-button-background--active': 'var(--ds-color-base-active)',
    '--dsc-button-color': 'var(--ds-color-base-contrast-default)',
    '--dsc-button-color--hover': 'var(--ds-color-base-contrast-default)',
    '--dsc-button-color--active': 'var(--ds-color-base-contrast-default)',
} as CSSProperties;

const defaultRange = (start: number, end: number, total: number) => `${start}–${end} of ${total}`;

const rangeReport = ({ page, pageSize, totalItems, ariaLabels }: TablePaginatorProps, format: typeof defaultRange) => {
    if (totalItems === undefined || pageSize === undefined || totalItems <= 0) return undefined;
    return (ariaLabels?.range ?? format)(page * pageSize + 1, Math.min((page + 1) * pageSize, totalItems), totalItems);
};

const defaultLabels = {
    navigation: 'Pagination',
    first: 'First page',
    previous: 'Previous page',
    next: 'Next page',
    last: 'Last page',
    pages: 'Pages',
    page: (number: number) => `Page ${number}`,
};

const useLabels = ({ ariaLabels }: TablePaginatorProps) => {
    const messages = useCratisComponentsConfig().messages?.paginator;
    const resolve = <K extends keyof typeof defaultLabels>(key: K) =>
        (ariaLabels?.[key] ?? messages?.[key] ?? defaultLabels[key]) as (typeof defaultLabels)[K];
    return {
        navigation: resolve('navigation'),
        first: resolve('first'),
        previous: resolve('previous'),
        next: resolve('next'),
        last: resolve('last'),
        page: resolve('page'),
        pages: resolve('pages'),
        range: messages?.range ?? defaultRange,
    };
};

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

const PageItem = ({ number, current, label, pt, onSelect }: PageItemProps) => (
    <Pagination.Button
            variant='tertiary'
            {...pt?.page}
            type='button'
            aria-label={label}
            aria-current={current ? 'page' : undefined}
            style={current ? { ...currentPageStyle, ...pt?.page?.style } : pt?.page?.style}
            className={classNames('cratis-designsystemet-paginator__page', pt?.page?.className)}
            data-selected={current || undefined}
            data-cratis-part='page'
            onClick={onSelect}
        >
            {number}
    </Pagination.Button>
);

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

const PageList = ({
    page,
    pageCount,
    pageLinks,
    onPageChange,
    pt,
    pageLabel,
    pagesLabel,
}: TablePaginatorProps & { readonly pageLabel: (page: number) => string; readonly pagesLabel: string }) => {
    const options = typeof pageLinks === 'object' ? pageLinks : undefined;
    const items = paginatorPages(page, pageCount, options?.siblings, options?.boundaries).map((item) =>
        item.kind === 'ellipsis' ? (
            <Ellipsis key={item.key} pt={pt} />
        ) : (
            <PageItem
                key={item.page}
                number={item.page + 1}
                current={item.page === page}
                label={pageLabel(item.page + 1)}
                pt={pt}
                onSelect={() => onPageChange(item.page)}
            />
        ),
    );
    // Same semantics as the built-in paginator: the numbered pages form one labelled group.
    return (
        <Pagination.Item>
            <div
                {...pt?.pages}
                role='group'
                aria-label={pagesLabel}
                className={classNames('cratis-designsystemet-paginator__pages', pt?.pages?.className)}
                data-cratis-part='pages'
            >
                {items}
            </div>
        </Pagination.Item>
    );
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
    const control = (name: ControlName, disabled: boolean, target: number, content: ReactNode) => (
        <Control
            name={name}
            label={labels[name]}
            parts={pt?.[name]}
            disabled={disabled}
            onActivate={() => onPageChange(target)}
        >
            {content}
        </Control>
    );
    return (
        <Pagination asChild>
            <div
                {...pt?.root}
                ref={rootRef}
                role='navigation'
                aria-label={labels.navigation}
                onFocus={(event) => {
                    rememberFocus(event.target);
                    pt?.root?.onFocus?.(event);
                }}
                className={classNames('cratis-designsystemet-paginator', 'cratis-table-paginator', pt?.root?.className, className)}
                data-cratis-part='root'
                data-cratis-component='TablePaginator'
            >
                <RangeReport text={range} pt={pt} />
                {control('first', isFirst, 0, <span aria-hidden='true'>«</span>)}
                <Pagination.List>
                    <Pagination.Item>{control('previous', isFirst, page - 1, labels.previous)}</Pagination.Item>
                    {pageLinks ? (
                        <PageList {...props} pageLabel={labels.page} pagesLabel={labels.pages} />
                    ) : (
                        <PageInfo page={page} pageCount={pageCount} pt={pt} />
                    )}
                    <Pagination.Item>{control('next', isLast, page + 1, labels.next)}</Pagination.Item>
                </Pagination.List>
                {control('last', isLast, pageCount - 1, <span aria-hidden='true'>»</span>)}
            </div>
        </Pagination>
    );
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useLayoutEffect,
    useRef,
    type CSSProperties,
    type FocusEventHandler,
    type ReactNode,
    type RefObject,
} from 'react';
import MuiButton from '@mui/material/Button';
import { useCratisComponentsConfig } from '@cratis/components';
import { paginatorPages, type TablePaginatorProps } from '@cratis/components/DataTables';

type ControlName = 'first' | 'previous' | 'next' | 'last';
type Parts = TablePaginatorProps['pt'];
type PageEntry = ReturnType<typeof paginatorPages>[number];
type Labels = ReturnType<typeof useLabels>;

const rowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
};

const classNames = (...names: readonly (string | undefined)[]) =>
    names.filter(Boolean).join(' ');

const defaultRange = (start: number, end: number, total: number) =>
    `${start}–${end} of ${total}`;

const rangeReport = (
    { page, pageSize, totalItems, ariaLabels }: TablePaginatorProps,
    format: typeof defaultRange,
) => {
    if (totalItems === undefined || pageSize === undefined || totalItems <= 0)
        return undefined;
    return (ariaLabels?.range ?? format)(
        page * pageSize + 1,
        Math.min((page + 1) * pageSize, totalItems),
        totalItems,
    );
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
    control !== null &&
    document.activeElement === control &&
    (control as HTMLButtonElement).disabled;

const useFocusKeeper = (
    rootRef: RefObject<HTMLDivElement | null>,
    isFirst: boolean,
    isLast: boolean,
) => {
    const focusedControl = useRef<HTMLElement | null>(null);
    useLayoutEffect(() => {
        const control = focusedControl.current;
        if (!lostFocus(control)) return;
        const buttons = [...(rootRef.current?.querySelectorAll('button') ?? [])];
        const index = buttons.indexOf(control as HTMLButtonElement);
        const candidates = isLast
            ? buttons.slice(0, index).reverse()
            : buttons.slice(index + 1);
        candidates.find((button) => !button.disabled)?.focus();
    }, [rootRef, isFirst, isLast]);
    return (element: HTMLElement) => {
        focusedControl.current = element;
    };
};

// Remembers the focused control for the focus keeper, then forwards the event to any part handler.
const composeFocus =
    (
        remember: (element: HTMLElement) => void,
        forward: FocusEventHandler<HTMLDivElement> | undefined,
    ): FocusEventHandler<HTMLDivElement> =>
    (event) => {
        remember(event.target);
        forward?.(event);
    };

interface ControlProps {
    readonly name: ControlName;
    readonly labels: Labels;
    readonly pt: Parts;
    readonly disabled: boolean;
    readonly target: number;
    readonly onPageChange: (page: number) => void;
    readonly children: ReactNode;
}

// A native `color` attribute on a part is not a Material UI palette color, so the palette default is set after the part spread.
const Control = ({ name, labels, pt, disabled, target, onPageChange, children }: ControlProps) => {
    const part = pt?.[name]?.root;
    return (
        <MuiButton
            variant='text'
            size='small'
            {...part}
            color='primary'
            type='button'
            aria-label={labels[name]}
            disabled={disabled}
            onClick={() => onPageChange(target)}
            className={classNames('cratis-mui-paginator__control', part?.className)}
            data-cratis-part={name}
        >
            {children}
        </MuiButton>
    );
};

const Ellipsis = ({ pt }: { readonly pt: Parts }) => (
    <span
        {...pt?.ellipsis}
        aria-hidden='true'
        className={classNames('cratis-mui-paginator__ellipsis', pt?.ellipsis?.className)}
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
        <MuiButton
            variant={current ? 'contained' : 'text'}
            size='small'
            {...part}
            color='primary'
            type='button'
            aria-label={label}
            aria-current={current ? 'page' : undefined}
            className={classNames('cratis-mui-paginator__page', part.className)}
            data-selected={current || undefined}
            data-cratis-part='page'
            onClick={onSelect}
        >
            {number}
        </MuiButton>
    );
};

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
    labels,
}: TablePaginatorProps & { readonly labels: Labels }) => {
    const options = typeof pageLinks === 'object' ? pageLinks : undefined;
    const group = pt?.pages;
    const entries = paginatorPages(page, pageCount, options?.siblings, options?.boundaries);
    // Same semantics as the built-in paginator: the numbered pages form one labelled group.
    return (
        <div
            {...group}
            style={{ ...rowStyle, ...group?.style }}
            role='group'
            aria-label={labels.pages}
            className={classNames('cratis-mui-paginator__pages', group?.className)}
            data-cratis-part='pages'
        >
            {entries.map((item) => (
                <PageListItem
                    key={itemKey(item)}
                    item={item}
                    page={page}
                    pageLabel={labels.page}
                    pt={pt}
                    onPageChange={onPageChange}
                />
            ))}
        </div>
    );
};

const RangeReport = ({ text, pt }: { readonly text: string | undefined; readonly pt: Parts }) =>
    text ? (
        <span
            {...pt?.range}
            className={classNames('cratis-table-paginator-range', pt?.range?.className)}
            data-cratis-part='range'
        >
            {text}
        </span>
    ) : null;

const PageInfo = ({
    page,
    pageCount,
    pt,
}: {
    readonly page: number;
    readonly pageCount: number;
    readonly pt: Parts;
}) => (
    <span
        {...pt?.info}
        className={classNames('cratis-table-paginator-info', pt?.info?.className)}
        data-cratis-part='info'
    >
        {page + 1} / {Math.max(pageCount, 1)}
    </span>
);

/** Material UI implementation of the stable atomic `datatables.paginator` slot. */
export const MuiPaginatorSlot = (props: TablePaginatorProps) => {
    const { page, pageCount, onPageChange, pageLinks = false, className, pt } = props;
    const labels = useLabels(props);
    const rootRef = useRef<HTMLDivElement>(null);
    const isFirst = page <= 0;
    const isLast = page >= pageCount - 1;
    const rememberFocus = useFocusKeeper(rootRef, isFirst, isLast);
    const control = { labels, pt, onPageChange };
    return (
        <div
            {...pt?.root}
            ref={rootRef}
            role='navigation'
            aria-label={labels.navigation}
            style={{ ...rowStyle, ...pt?.root?.style }}
            onFocus={composeFocus(rememberFocus, pt?.root?.onFocus)}
            className={classNames(
                'cratis-mui-paginator',
                'cratis-table-paginator',
                pt?.root?.className,
                className,
            )}
            data-cratis-part='root'
            data-cratis-component='TablePaginator'
        >
            <RangeReport text={rangeReport(props, labels.range)} pt={pt} />
            <Control {...control} name='first' disabled={isFirst} target={0}>
                <span aria-hidden='true'>«</span>
            </Control>
            <Control {...control} name='previous' disabled={isFirst} target={page - 1}>
                {labels.previous}
            </Control>
            {pageLinks ? (
                <PageList {...props} labels={labels} />
            ) : (
                <PageInfo page={page} pageCount={pageCount} pt={pt} />
            )}
            <Control {...control} name='next' disabled={isLast} target={page + 1}>
                {labels.next}
            </Control>
            <Control {...control} name='last' disabled={isLast} target={pageCount - 1}>
                <span aria-hidden='true'>»</span>
            </Control>
        </div>
    );
};

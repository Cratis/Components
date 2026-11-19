// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
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

const useLabels = ({ ariaLabels }: TablePaginatorProps) => {
    const messages = useCratisComponentsConfig().messages?.paginator;
    return {
        navigation: ariaLabels?.navigation ?? messages?.navigation ?? 'Pagination',
        first: ariaLabels?.first ?? messages?.first ?? 'First page',
        previous: ariaLabels?.previous ?? messages?.previous ?? 'Previous page',
        next: ariaLabels?.next ?? messages?.next ?? 'Next page',
        last: ariaLabels?.last ?? messages?.last ?? 'Last page',
        page: ariaLabels?.page ?? messages?.page ?? ((number: number) => `Page ${number}`),
        pages: ariaLabels?.pages ?? messages?.pages ?? 'Pages',
        range: messages?.range ?? defaultRange,
    };
};

// Paging to either end disables the control that was just activated, which would drop keyboard
// focus to the page body. Keep it inside the paginator, on the nearest enabled control.
const useFocusKeeper = (rootRef: RefObject<HTMLDivElement | null>, isFirst: boolean, isLast: boolean) => {
    const focusedControl = useRef<HTMLElement | null>(null);
    useLayoutEffect(() => {
        const control = focusedControl.current;
        if (!control || document.activeElement !== control || !(control as HTMLButtonElement).disabled) return;
        const buttons = [...(rootRef.current?.querySelectorAll('button') ?? [])];
        const index = buttons.indexOf(control as HTMLButtonElement);
        const candidates = isLast ? buttons.slice(0, index).reverse() : buttons.slice(index + 1);
        candidates.find((button) => !button.disabled)?.focus();
    }, [rootRef, isFirst, isLast]);
    return (element: HTMLElement) => {
        focusedControl.current = element;
    };
};

// The numbered pages and the previous/next controls share Designsystemet's one list, so that list
// carries the pages part; its group name is the list's accessible name.
const pagesPart = (parts: HTMLAttributes<HTMLDivElement> | undefined, label: string) =>
    ({
        ...parts,
        'aria-label': label,
        className: classNames('cratis-designsystemet-paginator__pages', parts?.className),
        'data-cratis-part': 'pages',
    }) as unknown as HTMLAttributes<HTMLUListElement>;

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

const PageList = ({
    page,
    pageCount,
    pageLinks,
    onPageChange,
    pt,
    pageLabel,
}: TablePaginatorProps & { readonly pageLabel: (page: number) => string }) => {
    const options = typeof pageLinks === 'object' ? pageLinks : undefined;
    return paginatorPages(page, pageCount, options?.siblings, options?.boundaries).map((item) =>
        item.kind === 'ellipsis' ? (
            <Pagination.Item key={item.key}>
                <span
                    {...pt?.ellipsis}
                    aria-hidden='true'
                    className={classNames('cratis-designsystemet-paginator__ellipsis', pt?.ellipsis?.className)}
                    data-cratis-part='ellipsis'
                >
                    …
                </span>
            </Pagination.Item>
        ) : (
            <Pagination.Item key={item.page}>
                <Pagination.Button
                    variant='tertiary'
                    {...pt?.page}
                    type='button'
                    aria-label={pageLabel(item.page + 1)}
                    aria-current={item.page === page ? 'page' : undefined}
                    style={item.page === page ? { ...currentPageStyle, ...pt?.page?.style } : pt?.page?.style}
                    className={classNames('cratis-designsystemet-paginator__page', pt?.page?.className)}
                    data-selected={item.page === page || undefined}
                    data-cratis-part='page'
                    onClick={() => onPageChange(item.page)}
                >
                    {item.page + 1}
                </Pagination.Button>
            </Pagination.Item>
        ),
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
                {range && (
                    <span
                        {...pt?.range}
                        className={classNames('cratis-table-paginator-range', pt?.range?.className)}
                        data-cratis-part='range'
                    >
                        {range}
                    </span>
                )}
                {control('first', isFirst, 0, <span aria-hidden='true'>«</span>)}
                <Pagination.List {...(pageLinks ? pagesPart(pt?.pages, labels.pages) : undefined)}>
                    <Pagination.Item>{control('previous', isFirst, page - 1, labels.previous)}</Pagination.Item>
                    {pageLinks ? (
                        <PageList {...props} pageLabel={labels.page} />
                    ) : (
                        <Pagination.Item>
                            <span
                                {...pt?.info}
                                className={classNames('cratis-table-paginator-info', pt?.info?.className)}
                                data-cratis-part='info'
                            >
                                {page + 1} / {Math.max(pageCount, 1)}
                            </span>
                        </Pagination.Item>
                    )}
                    <Pagination.Item>{control('next', isLast, page + 1, labels.next)}</Pagination.Item>
                </Pagination.List>
                {control('last', isLast, pageCount - 1, <span aria-hidden='true'>»</span>)}
            </div>
        </Pagination>
    );
};

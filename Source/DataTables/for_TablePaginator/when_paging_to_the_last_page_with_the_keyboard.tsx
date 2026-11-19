// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { TablePaginator } from '../TablePaginator';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Harness = ({ pageCount, start }: { pageCount: number; start: number }) => {
    const [page, setPage] = useState(start);
    return <TablePaginator page={page} pageCount={pageCount} onPageChange={setPage} />;
};

describe('when paging to the last page with the keyboard', () => {
    let container: HTMLDivElement;
    let root: Root;
    const button = (label: string) =>
        container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) as HTMLButtonElement;

    beforeEach(async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => root.render(<Harness pageCount={3} start={1} />));
        button('Next page').focus();
        await act(async () => button('Next page').click());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should disable the next page button', () => {
        button('Next page').disabled.should.equal(true);
    });

    it('should keep focus inside the paginator on the previous page button', () => {
        (document.activeElement === button('Previous page')).should.equal(true);
    });
});

describe('when paging back to the first page with the keyboard', () => {
    let container: HTMLDivElement;
    let root: Root;
    const button = (label: string) =>
        container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`) as HTMLButtonElement;

    beforeEach(async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await act(async () => root.render(<Harness pageCount={2} start={1} />));
        button('Previous page').focus();
        await act(async () => button('Previous page').click());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should keep focus inside the paginator on the next page button', () => {
        (document.activeElement === button('Next page')).should.equal(true);
    });
});

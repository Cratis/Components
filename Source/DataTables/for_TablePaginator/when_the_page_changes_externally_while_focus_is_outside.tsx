// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { TablePaginator } from '../TablePaginator';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('when the page changes externally while focus is outside the paginator', () => {
    let container: HTMLDivElement;
    let root: Root;
    let outside: HTMLButtonElement;
    const render = (page: number) =>
        act(async () =>
            root.render(
                <>
                    <button type='button' id='outside'>
                        Outside
                    </button>
                    <TablePaginator page={page} pageCount={3} onPageChange={() => undefined} />
                </>,
            ),
        );

    beforeEach(async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        await render(1);
        // Focus was in the paginator earlier, then moved outside.
        (container.querySelector('button[aria-label="Next page"]') as HTMLButtonElement).focus();
        outside = container.querySelector('#outside') as HTMLButtonElement;
        outside.focus();
        await render(2);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should disable the next page button', () => {
        (container.querySelector('button[aria-label="Next page"]') as HTMLButtonElement).disabled.should.equal(true);
    });

    it('should leave focus on the outside button', () => {
        (document.activeElement === outside).should.equal(true);
    });
});

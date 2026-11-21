// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';
import { aMobileViewport } from './given/a_mobile_viewport';

should();
const table = <DataTableCore data={[{ name: 'Example Project' }]} emptyMessage='No rows' mobileLayout='cards'><Column field='name' header='Name' /></DataTableCore>;

it('should server-render table markup regardless of a narrow viewport', () => {
    aMobileViewport();
    renderToString(table).should.contain('<table');
    vi.unstubAllGlobals();
});

describe('when hydrating a table on a narrow viewport', () => {
    let container: HTMLDivElement;
    let root: Root;
    let errors: unknown[];
    beforeEach(async () => {
        (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        aMobileViewport();
        errors = [];
        container = document.createElement('div');
        container.innerHTML = renderToString(table);
        document.body.append(container);
        await act(async () => { root = hydrateRoot(container, table, { onRecoverableError: error => errors.push(error) }); });
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });
    it('should not have a hydration mismatch', () => {
        errors.should.have.lengthOf(0);
    });
    it('should switch to cards after hydration', () => {
        container.querySelectorAll('ul').length.should.equal(1);
    });
});

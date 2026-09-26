// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { PivotViewer } from '../../PivotViewer';

describe('when loading with a labels override', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <PivotViewer data={[]} dimensions={[]} cardRenderer={() => ({ title: 'Sample item' })} isLoading labels={{ loading: 'Preparing items…' }} />,
        );
    });

    it('should use the loading label from labels', () => {
        html.should.include('class="pv-loading__label">Preparing items…</span>');
    });
});

describe('when loading with both label overrides', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <PivotViewer data={[]} dimensions={[]} cardRenderer={() => ({ title: 'Sample item' })} isLoading loadingLabel='Loading items…' labels={{ loading: 'Preparing items…' }} />,
        );
    });

    it('should preserve the loadingLabel prop precedence', () => {
        html.should.include('class="pv-loading__label">Loading items…</span>');
    });
});

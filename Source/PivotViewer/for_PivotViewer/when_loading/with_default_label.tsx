// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { PivotViewer } from '../../PivotViewer';

describe('when PivotViewer is loading with the default label', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <PivotViewer data={[]} dimensions={[]} cardRenderer={() => ({ title: 'Sample item' })} isLoading />,
        );
    });

    it('should expose the loading status', () => {
        html.should.include('role="status"');
        html.should.include('class="pv-loading__label">Loading…</span>');
        html.should.include('aria-hidden="true"');
    });
});

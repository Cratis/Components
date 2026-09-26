// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { PivotViewer } from '../../PivotViewer';

describe('when PivotViewer is loading with a custom label', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <PivotViewer data={[]} dimensions={[]} cardRenderer={() => ({ title: 'Sample item' })} isLoading loadingLabel='Loading projects…' />,
        );
    });

    it('should expose the custom status label', () => {
        html.should.include('role="status"');
        html.should.include('Loading projects…');
    });
});

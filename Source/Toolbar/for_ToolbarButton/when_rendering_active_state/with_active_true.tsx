// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { ToolbarButton } from '../../ToolbarButton';

describe('when rendering a ToolbarButton with active true', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(<ToolbarButton title='Draw' active={true} />);
    });

    it('should announce the pressed state', () => {
        html.should.include('aria-pressed="true"');
    });
});

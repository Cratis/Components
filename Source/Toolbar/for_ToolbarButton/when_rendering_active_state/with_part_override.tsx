// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { ToolbarButton } from '../../ToolbarButton';

describe('when rendering a ToolbarButton with a part override', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(<ToolbarButton title='Draw' active={true} pt={{ root: { 'aria-pressed': false } }} />);
    });

    it('should preserve the caller pressed state', () => {
        html.should.include('aria-pressed="false"');
        html.should.not.include('aria-pressed="true"');
    });
});

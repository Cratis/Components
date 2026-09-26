// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { ToolbarFolderContext } from '../../ToolbarFolderContext';
import { ToolbarButton } from '../../ToolbarButton';

describe('when rendering an active ToolbarButton in list mode', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <ToolbarFolderContext.Provider value='list'>
                <ToolbarButton title='Draw' active />
            </ToolbarFolderContext.Provider>,
        );
    });

    it('should announce the pressed state', () => {
        html.should.include('aria-pressed="true"');
    });
});

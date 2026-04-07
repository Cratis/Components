// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IconDisplay } from '../../Icon';

describe('when IconDisplay is given a React node icon and rendered', () => {
    let html: string;

    beforeEach(() => {
        const svgIcon = React.createElement('svg', { 'data-testid': 'custom-icon' });
        const element = React.createElement(IconDisplay, { icon: svgIcon });
        html = renderToStaticMarkup(element);
    });

    it('should_render_the_react_node_directly', () => {
        html.should.include('<svg');
    });

    it('should_not_render_an_i_element', () => {
        html.should.not.include('<i');
    });
});

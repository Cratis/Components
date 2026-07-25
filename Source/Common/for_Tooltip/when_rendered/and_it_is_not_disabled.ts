// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip } from '../../Tooltip';

describe('when Tooltip is rendered and it is not disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(
            Tooltip,
            { content: 'Shapes' },
            React.createElement('button', null, 'Trigger'),
        ),
    );

    it('should render the tooltip bubble', () => {
        html.should.include('role="tooltip"');
    });

    it('should render the tooltip content', () => {
        html.should.include('Shapes');
    });
});

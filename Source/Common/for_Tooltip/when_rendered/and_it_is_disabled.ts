// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip } from '../../Tooltip';

describe('when Tooltip is rendered and it is disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(
            Tooltip,
            { content: 'Shapes', disabled: true },
            React.createElement('button', null, 'Trigger'),
        ),
    );

    it('should not render the tooltip bubble', () => {
        html.should.not.include('role="tooltip"');
    });

    it('should still render the trigger element', () => {
        html.should.include('Trigger');
    });
});

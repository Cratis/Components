// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CratisComponentsProvider } from '../../CratisComponentsProvider';
import { Tooltip } from '../../Tooltip';

// An enabled tooltip reaches PrimeReact 11's compositional Tooltip, which resolves its
// configuration from a `PrimeReactProvider` and throws without one — so the trigger is
// rendered inside the Cratis provider that supplies it. The disabled case needs none,
// because it never renders a PrimeReact component at all.
describe('when Tooltip is rendered and it is not disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(
            CratisComponentsProvider,
            null,
            React.createElement(
                Tooltip,
                { content: 'Shapes' },
                React.createElement('button', null, 'Trigger'),
            ),
        ),
    );

    it('should attach a tooltip to the trigger', () => {
        html.should.include('cratis-tooltip-trigger');
    });

    it('should render the trigger element', () => {
        html.should.include('Trigger');
    });
});

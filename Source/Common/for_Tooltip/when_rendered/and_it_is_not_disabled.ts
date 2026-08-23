// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../CratisComponentsProvider';
import { Tooltip } from '../../Tooltip';

// The provider supplies the locale used by the internal accessible tooltip behavior.
describe('when Tooltip is rendered and it is not disabled', () => {
    const html = renderToStaticMarkup(
        React.createElement(
            CratisComponentsProvider,
            null,
            React.createElement(Tooltip, {
                content: 'Shapes',
                children: React.createElement('button', null, 'Trigger'),
            }),
        ),
    );

    it('should attach a tooltip to the trigger', () => {
        expect(html).to.include('cratis-tooltip-trigger');
    });

    it('should render the trigger element', () => {
        expect(html).to.include('Trigger');
    });

    it('should apply focus behavior to the actual trigger without a wrapper', () => {
        expect(html).to.match(/^<button[^>]+data-cratis-part="trigger"/);
        expect(html.match(/tabindex="0"/g)).to.have.lengthOf(1);
    });
});

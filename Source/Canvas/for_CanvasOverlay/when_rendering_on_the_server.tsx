// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CanvasOverlay } from '../CanvasOverlay';

describe('when rendering on the server', () => {
    it('should render an empty hydration-safe placeholder without accessing document', () => {
        expect(
            renderToStaticMarkup(
                <CanvasOverlay>
                    <div>Overlay</div>
                </CanvasOverlay>,
            ),
        ).to.equal('');
    });
});

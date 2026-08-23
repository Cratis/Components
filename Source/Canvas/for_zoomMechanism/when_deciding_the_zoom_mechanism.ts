// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { shouldUseCssZoom } from '../zoomMechanism';

describe('when zoomed in past 100% at rest on a mouse/trackpad device', () => {
    it('should use crisp CSS zoom', () => {
        shouldUseCssZoom(1.5, false, false).should.be.true;
    });
});

describe('when zoomed in past 100% at rest on a multi-touch-capable device', () => {
    it('should use transform scale instead, avoiding the iPadOS CSS zoom font-scaling bug', () => {
        shouldUseCssZoom(1.5, false, true).should.be.false;
    });
});

describe('when a gesture is actively in motion', () => {
    it('should use transform scale regardless of touch capability', () => {
        shouldUseCssZoom(1.5, true, false).should.be.false;
        shouldUseCssZoom(1.5, true, true).should.be.false;
    });
});

describe('when zoomed at or below 100%', () => {
    it('should use transform scale regardless of gesture state or touch capability', () => {
        shouldUseCssZoom(1, false, false).should.be.false;
        shouldUseCssZoom(0.5, false, false).should.be.false;
        shouldUseCssZoom(1, false, true).should.be.false;
    });
});

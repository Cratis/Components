// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { raisedOverlayZIndex } from '../useOverlayZIndex';

describe('when deciding the panel z-index', () => {
    it('should raise a panel sitting below the floor', () => {
        raisedOverlayZIndex('1001', 10000)!.should.equal('10000');
    });

    it('should raise a panel with no z-index of its own', () => {
        raisedOverlayZIndex('', 10000)!.should.equal('10000');
    });

    it('should leave a panel sitting exactly on the floor alone', () => {
        (raisedOverlayZIndex('10000', 10000) === undefined).should.be.true;
    });

    it('should never lower a panel PrimeReact stacked above the floor', () => {
        (raisedOverlayZIndex('20102', 10000) === undefined).should.be.true;
    });
});

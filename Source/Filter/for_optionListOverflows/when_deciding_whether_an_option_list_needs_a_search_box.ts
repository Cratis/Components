// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { optionListOverflows } from '../utils';

describe('when deciding whether an option list needs a search box', () => {
    it('should overflow when the content is taller than the box', () => {
        expect(
            optionListOverflows({ contentHeight: 400, maxHeight: 224 }),
        ).to.equal(true);
    });

    it('should not overflow when the content fits inside the box', () => {
        expect(
            optionListOverflows({ contentHeight: 100, maxHeight: 224 }),
        ).to.equal(false);
    });

    it('should not overflow when the content exactly fills the box', () => {
        expect(
            optionListOverflows({ contentHeight: 224, maxHeight: 224 }),
        ).to.equal(false);
    });

    it('should not overflow when the box has not been measured yet', () => {
        expect(
            optionListOverflows({ contentHeight: 400, maxHeight: 0 }),
        ).to.equal(false);
    });
});

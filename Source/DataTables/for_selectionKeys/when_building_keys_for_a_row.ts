// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { selectionKeysForRow } from '../selectionKeys';

interface Row { id: number; name: string; }

describe('when building selection keys for a selected row', () => {
    let keys: Record<string, boolean>;

    beforeEach(() => {
        keys = selectionKeysForRow<Row>({ id: 7, name: 'Sample User 02' }, 'id');
    });

    it('should mark the stringified dataKey value as selected', () => {
        keys['7'].should.be.true;
    });

    it('should contain exactly one key', () => {
        Object.keys(keys).should.have.lengthOf(1);
    });
});

describe('when building selection keys with nothing selected', () => {
    it('should return an empty map', () => {
        Object.keys(selectionKeysForRow<Row>(null, 'id')).should.have.lengthOf(0);
    });
});

describe('when building selection keys without a dataKey', () => {
    it('should return an empty map', () => {
        Object.keys(selectionKeysForRow<Row>({ id: 7, name: 'Sample User 02' }, undefined)).should.have.lengthOf(0);
    });
});

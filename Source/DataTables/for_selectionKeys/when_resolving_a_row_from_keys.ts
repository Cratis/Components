// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { rowFromSelectionKeys } from '../selectionKeys';

interface Row { id: number; name: string; }

const data: Row[] = [{ id: 1, name: 'Sample User 01' }, { id: 2, name: 'Sample User 02' }, { id: 3, name: 'Sample User 03' }];

describe('when resolving a row from a selection-keys map with a selected key', () => {
    let row: Row | null;

    beforeEach(() => {
        row = rowFromSelectionKeys<Row>({ '2': true }, data, 'id');
    });

    it('should return the matching row', () => {
        (row?.name ?? '').should.equal('Sample User 02');
    });
});

describe('when resolving a row from a selection-keys map with no selected key', () => {
    it('should return null', () => {
        const result = rowFromSelectionKeys<Row>({ '2': false }, data, 'id');
        (result === null).should.be.true;
    });
});

describe('when resolving a row from a selection-keys map whose key is not in the data', () => {
    it('should return null', () => {
        const result = rowFromSelectionKeys<Row>({ '99': true }, data, 'id');
        (result === null).should.be.true;
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { valueAtPath } from '../valueAtPath';

describe('when reading a nested path', () => {
    it('should return the nested value', () => {
        (valueAtPath({ address: { city: 'Example City' } }, 'address.city') as string).should.equal('Example City');
    });
});

describe('when reading a path with a missing segment', () => {
    it('should return undefined', () => {
        (valueAtPath({ address: null }, 'address.city') === undefined).should.be.true;
    });
});

describe('when reading a path through an inherited property', () => {
    it('should not read properties the row does not own', () => {
        (valueAtPath({}, 'constructor') === undefined).should.be.true;
    });
});

describe('when reading a path to a function', () => {
    it('should return the function as text', () => {
        const value = valueAtPath({ describe: () => 'value' }, 'describe');
        (typeof value).should.equal('string');
    });
});

describe('when reading without a path', () => {
    it('should return undefined', () => {
        (valueAtPath({ name: 'Sample User' }, undefined) === undefined).should.be.true;
    });
});

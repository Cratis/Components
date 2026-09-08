// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueByPath } from '../types';

describe('when getting a value through the prototype chain', () => {
    const item = Object.create({ inherited: 'not searchable' }) as Record<
        string,
        unknown
    >;

    it('should not return an inherited property', () => {
        (getValueByPath(item, 'inherited') === undefined).should.be.true;
    });

    it('should not traverse __proto__', () => {
        (getValueByPath(item, '__proto__.inherited') === undefined).should.be.true;
    });
});

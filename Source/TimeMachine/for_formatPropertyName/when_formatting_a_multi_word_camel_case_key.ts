// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { formatPropertyName } from '../propertiesHelpers';

describe('when formatting a multi-word camelCase key', () => {
    let result: string;

    beforeEach(() => {
        result = formatPropertyName('myPropertyName');
    });

    it('should separate all words and capitalize the first letter', () => {
        result.should.equal('My Property Name');
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { fieldValueFromEvent } from '../fields/fieldValueFromEvent';

describe('when extracting supported field values', () => {
    it('should extract a string value', () => {
        fieldValueFromEvent({ target: { value: 'Sample value' } }, 'value').should.equal(
            'Sample value',
        );
    });

    it('should extract a checked value', () => {
        fieldValueFromEvent({ target: { checked: true } }, 'checked').should.equal(true);
    });

    it('should extract a numeric value', () => {
        fieldValueFromEvent(
            { target: { valueAsNumber: 42 } },
            'valueAsNumber',
        ).should.equal(42);
    });
});

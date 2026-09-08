// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { fieldValueFromEvent } from '../fields/fieldValueFromEvent';

describe('when receiving an invalid field event', () => {
    it('should reject an event without an object target', () => {
        (() => fieldValueFromEvent({}, 'value')).should.throw(
            TypeError,
            'Expected a field event with an object target',
        );
    });

    it('should reject a field value with the wrong type', () => {
        (() =>
            fieldValueFromEvent({ target: { checked: 'true' } }, 'checked')).should.throw(
            TypeError,
            'Expected field event target.checked to have the matching primitive type',
        );
    });
});

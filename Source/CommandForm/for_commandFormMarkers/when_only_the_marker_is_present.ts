// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isCommandFormColumn, isCommandFormField } from '../commandFormMarkers';

// The mirror of when_only_the_legacy_display_name_is_present: a component carrying
// the marker and no `displayName` whatsoever. This is the case a build transform
// cannot produce by renaming, and the one that proves the marker is sufficient on
// its own rather than merely corroborating the legacy label.
const stampMarkerOnly = (marker: 'isCommandFormField' | 'isCommandFormColumn'): object => {
    const component = () => undefined;
    (component as unknown as Record<string, boolean>)[marker] = true;
    return component;
};

describe('when a component carries only the marker', () => {
    let field: object;
    let column: object;

    beforeEach(() => {
        field = stampMarkerOnly('isCommandFormField');
        column = stampMarkerOnly('isCommandFormColumn');
    });

    it('should recognize the field', () => {
        isCommandFormField(field).should.be.true;
    });

    it('should recognize the column', () => {
        isCommandFormColumn(column).should.be.true;
    });

    it('should not mistake a field for a column', () => {
        isCommandFormColumn(field).should.be.false;
    });

    it('should not mistake a column for a field', () => {
        isCommandFormField(column).should.be.false;
    });

    // Guards the four assertions above: if a `displayName` had leaked onto these
    // components they would pass through the legacy fallback instead.
    it('should have no display name at all', () => {
        ((field as { displayName?: string }).displayName === undefined).should.be.true;
        ((column as { displayName?: string }).displayName === undefined).should.be.true;
    });
});

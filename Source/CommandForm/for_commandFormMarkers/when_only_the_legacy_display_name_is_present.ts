// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CommandFormColumnDisplayName,
    CommandFormFieldDisplayName,
    isCommandFormColumn,
    isCommandFormField,
} from '../commandFormMarkers';

// The compatibility surface. A consumer marking a field by hand, and any
// `@cratis/arc.react` predating the marker, stamp nothing but the `displayName` —
// so this pins the fallback against a later cleanup that would delete it and
// silently unbind every such field.
const stampDisplayNameOnly = (name: string): object => {
    const component = () => undefined;
    (component as { displayName?: string }).displayName = name;
    return component;
};

describe('when a component carries only the legacy displayName', () => {
    let field: object;
    let column: object;

    beforeEach(() => {
        field = stampDisplayNameOnly(CommandFormFieldDisplayName);
        column = stampDisplayNameOnly(CommandFormColumnDisplayName);
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
});

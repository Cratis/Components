// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CommandFormColumnDisplayName,
    CommandFormFieldDisplayName,
    isCommandFormColumn,
    isCommandFormField,
    markAsCommandFormColumn,
    markAsCommandFormField,
} from '../commandFormMarkers';

// Reproduces what a build-time transform does to a marked component. Storybook's
// `reactDocgen: 'react-docgen-typescript'` setting runs a plugin that defaults to
// appending `<Component>.displayName = "<ExportName>"` to every module it
// processes, silently replacing the label the framework stamped.
const overwriteDisplayName = (component: object, name: string): void => {
    (component as { displayName?: string }).displayName = name;
};

describe('when a marked component has had its displayName overwritten', () => {
    let field: object;
    let column: object;

    beforeEach(() => {
        field = markAsCommandFormField(() => undefined);
        column = markAsCommandFormColumn(() => undefined);
        overwriteDisplayName(field, 'AppInputTextField');
        overwriteDisplayName(column, 'AppColumnWrapper');
    });

    it('should still recognize the field', () => {
        isCommandFormField(field).should.be.true;
    });

    it('should still recognize the column', () => {
        isCommandFormColumn(column).should.be.true;
    });

    it('should not mistake a field for a column', () => {
        isCommandFormColumn(field).should.be.false;
    });

    it('should not mistake a column for a field', () => {
        isCommandFormField(column).should.be.false;
    });

    // These two guard the specs above: if the overwrite silently failed to take,
    // every assertion here would pass through the legacy `displayName` fallback
    // and prove nothing about the marker.
    it('should have actually lost the legacy field display name', () => {
        (field as { displayName?: string }).displayName!.should.not.equal(CommandFormFieldDisplayName);
    });

    it('should have actually lost the legacy column display name', () => {
        (column as { displayName?: string }).displayName!.should.not.equal(CommandFormColumnDisplayName);
    });
});

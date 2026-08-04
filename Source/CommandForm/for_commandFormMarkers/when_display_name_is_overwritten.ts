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

    it('should_still_recognise_the_field', () => {
        isCommandFormField(field).should.be.true;
    });

    it('should_still_recognise_the_column', () => {
        isCommandFormColumn(column).should.be.true;
    });

    it('should_not_mistake_a_field_for_a_column', () => {
        isCommandFormColumn(field).should.be.false;
    });

    it('should_not_mistake_a_column_for_a_field', () => {
        isCommandFormField(column).should.be.false;
    });

    // These two guard the specs above: if the overwrite silently failed to take,
    // every assertion here would pass through the legacy `displayName` fallback
    // and prove nothing about the marker.
    it('should_have_actually_lost_the_legacy_field_display_name', () => {
        (field as { displayName?: string }).displayName!.should.not.equal(CommandFormFieldDisplayName);
    });

    it('should_have_actually_lost_the_legacy_column_display_name', () => {
        (column as { displayName?: string }).displayName!.should.not.equal(CommandFormColumnDisplayName);
    });
});

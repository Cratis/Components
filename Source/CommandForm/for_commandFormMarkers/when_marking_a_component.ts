// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CommandFormColumnDisplayName,
    CommandFormColumnMarker,
    CommandFormFieldDisplayName,
    CommandFormFieldMarker,
    markAsCommandFormColumn,
    markAsCommandFormField,
} from '../commandFormMarkers';

// The helpers set *both* identifiers, and both halves matter. The marker is what
// survives a build transform; the legacy `displayName` is what an older
// `@cratis/arc.react` — which knows nothing of the marker — needs in order to bind
// the component at all. This package's peer range admits exactly those versions,
// so a helper that set only the marker would silently unbind every component it
// touched on a perfectly supported Arc.
describe('when marking a component', () => {
    let field: object;
    let column: object;

    beforeEach(() => {
        field = markAsCommandFormField(() => undefined);
        column = markAsCommandFormColumn(() => undefined);
    });

    it('should_set_the_field_marker', () => {
        (field as Record<symbol, unknown>)[CommandFormFieldMarker]!.should.equal(true);
    });

    it('should_set_the_column_marker', () => {
        (column as Record<symbol, unknown>)[CommandFormColumnMarker]!.should.equal(true);
    });

    it('should_also_set_the_legacy_field_display_name_for_older_arc', () => {
        (field as { displayName?: string }).displayName!.should.equal(CommandFormFieldDisplayName);
    });

    it('should_also_set_the_legacy_column_display_name_for_older_arc', () => {
        (column as { displayName?: string }).displayName!.should.equal(CommandFormColumnDisplayName);
    });

    it('should_not_cross_mark_a_field_with_the_column_marker', () => {
        ((field as Record<symbol, unknown>)[CommandFormColumnMarker] === undefined).should.be.true;
    });

    // The helpers mark in place and hand the component back, so both
    // `markAsCommandFormField(C)` as a statement and `const C = markAs...(fn)` as an
    // expression mark the same object — the two call styles used across this package.
    it('should_return_the_very_component_it_marked', () => {
        const component = () => undefined;
        markAsCommandFormField(component).should.equal(component);
    });
});

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

    it('should set the field marker', () => {
        (field as Record<symbol, unknown>)[CommandFormFieldMarker]!.should.equal(true);
    });

    it('should set the column marker', () => {
        (column as Record<symbol, unknown>)[CommandFormColumnMarker]!.should.equal(true);
    });

    it('should also set the legacy field display name for older arc', () => {
        (field as { displayName?: string }).displayName!.should.equal(CommandFormFieldDisplayName);
    });

    it('should also set the legacy column display name for older arc', () => {
        (column as { displayName?: string }).displayName!.should.equal(CommandFormColumnDisplayName);
    });

    it('should not cross mark a field with the column marker', () => {
        ((field as Record<symbol, unknown>)[CommandFormColumnMarker] === undefined).should.be.true;
    });

    // The helpers mark in place and hand the component back, so both
    // `markAsCommandFormField(C)` as a statement and `const C = markAs...(fn)` as an
    // expression mark the same object — the two call styles used across this package.
    it('should return the very component it marked', () => {
        const component = () => undefined;
        markAsCommandFormField(component).should.equal(component);
    });
});

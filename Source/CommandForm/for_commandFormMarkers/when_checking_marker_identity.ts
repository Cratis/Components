// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { CommandFormColumnMarker, CommandFormFieldMarker } from '../commandFormMarkers';

// Why this spec exists: the markers are `Symbol.for` registry keys rather than
// plain `Symbol`s precisely so that two module instances — a duplicate install, a
// bundler that fails to dedupe, or `@cratis/arc.react` and `@cratis/components`
// each carrying their own copy — still agree on one key. A plain `Symbol()` would
// produce two keys that never compare equal, and every field marked by one
// instance would be invisible to the other: the same silent unbind the marker
// exists to prevent, reached by a different route.
//
// Resolving the key from the global registry here is exactly what a second
// instance of the module would do, so an equal result is the guarantee itself.
describe('when checking marker identity', () => {
    it('should_resolve_the_field_marker_from_the_global_symbol_registry', () => {
        (Symbol.for('cratis.commandFormField') === CommandFormFieldMarker).should.be.true;
    });

    it('should_resolve_the_column_marker_from_the_global_symbol_registry', () => {
        (Symbol.for('cratis.commandFormColumn') === CommandFormColumnMarker).should.be.true;
    });

    it('should_keep_the_field_and_column_markers_distinct', () => {
        (CommandFormFieldMarker === (CommandFormColumnMarker as symbol)).should.be.false;
    });
});

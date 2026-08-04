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
// `Symbol.keyFor` returns undefined for any symbol outside the global registry, so
// it tells `Symbol.for('x')` apart from `Symbol('x')` — which nothing else about
// the value does — and it names the key the other package has to use. Those key
// strings are the whole cross-package contract: changing one is a breaking change
// even though no exported identifier changes.
describe('when checking marker identity', () => {
    it('should_register_the_field_marker_globally_under_its_documented_key', () => {
        Symbol.keyFor(CommandFormFieldMarker)!.should.equal('cratis.commandFormField');
    });

    it('should_register_the_column_marker_globally_under_its_documented_key', () => {
        Symbol.keyFor(CommandFormColumnMarker)!.should.equal('cratis.commandFormColumn');
    });

    it('should_resolve_the_field_marker_a_second_module_instance_would_compute', () => {
        (Symbol.for('cratis.commandFormField') === CommandFormFieldMarker).should.be.true;
    });

    it('should_resolve_the_column_marker_a_second_module_instance_would_compute', () => {
        (Symbol.for('cratis.commandFormColumn') === CommandFormColumnMarker).should.be.true;
    });

    it('should_keep_the_field_and_column_markers_distinct', () => {
        (CommandFormFieldMarker as symbol).should.not.equal(CommandFormColumnMarker as symbol);
    });
});

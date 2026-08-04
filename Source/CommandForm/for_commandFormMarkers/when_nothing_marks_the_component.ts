// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { CommandFormFieldMarker, isCommandFormColumn, isCommandFormField } from '../commandFormMarkers';

describe('when nothing marks the component', () => {
    it('should_not_recognise_an_unmarked_component', () => {
        isCommandFormField(() => undefined).should.be.false;
    });

    it('should_not_recognise_an_unrelated_display_name', () => {
        const component = () => undefined;
        (component as { displayName?: string }).displayName = 'StepperPanel';
        isCommandFormField(component).should.be.false;
        isCommandFormColumn(component).should.be.false;
    });

    // A child's `type` is a string for host elements such as `<div>`, and the
    // predicates are called on every child a form is given, so neither of these
    // may throw.
    it('should_not_recognise_a_host_element', () => {
        isCommandFormField('div').should.be.false;
        isCommandFormColumn('div').should.be.false;
    });

    // Pins the `=== true` comparison rather than a truthiness check. A component
    // that deliberately carries `marker = false` is opting out, and must not be
    // recognised through some other value that merely happens to be present.
    it('should_not_recognise_a_marker_that_is_not_true', () => {
        const disabled = () => undefined;
        (disabled as unknown as Record<symbol, unknown>)[CommandFormFieldMarker] = false;
        isCommandFormField(disabled).should.be.false;

        const wrongType = () => undefined;
        (wrongType as unknown as Record<symbol, unknown>)[CommandFormFieldMarker] = 'yes';
        isCommandFormField(wrongType).should.be.false;
    });

    it('should_not_recognise_nullish_values', () => {
        isCommandFormField(undefined).should.be.false;
        isCommandFormField(null).should.be.false;
        isCommandFormColumn(undefined).should.be.false;
        isCommandFormColumn(null).should.be.false;
    });
});

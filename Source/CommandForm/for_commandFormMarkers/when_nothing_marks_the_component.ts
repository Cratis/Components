// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isCommandFormColumn, isCommandFormField } from '../commandFormMarkers';

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

    it('should_not_recognise_nullish_values', () => {
        isCommandFormField(undefined).should.be.false;
        isCommandFormField(null).should.be.false;
        isCommandFormColumn(undefined).should.be.false;
        isCommandFormColumn(null).should.be.false;
    });
});

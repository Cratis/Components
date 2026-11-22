// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Mount } from '../for_OrderedItemEditor/Mount';
import { Harness } from './given';

should();

const parts = {
    input: { className: 'sample-input' },
    select: { className: 'sample-select' },
    label: { className: 'sample-label' },
    value: { className: 'sample-value' },
    message: { className: 'sample-message' },
};

const messages = { gap: 'Gap message', align: 'Alignment message', name: 'Name message', columns: 'Columns message' };

describe('when styling property parts', () => {
    const mount = new Mount();
    beforeEach(() => mount.setup());
    afterEach(() => mount.teardown());

    const classesOf = (selector: string) =>
        Array.from(mount.container.querySelectorAll(selector)).map((element) => element.className);

    it('should_append_part_classes_to_the_built_in_classes', async () => {
        await mount.render(<Harness proposals={[]} pt={parts} messages={messages} />);

        classesOf('input, select').should.deep.equal([
            'cratis-property__input sample-input',
            'cratis-property__input sample-select',
            'cratis-property__input sample-input',
            'cratis-property__input sample-input',
            'cratis-property__input sample-input',
            'cratis-property__input sample-input',
            'cratis-property__input sample-input',
        ]);
        classesOf('[data-cratis-part="label"]').should.include('cratis-property__label sample-label');
        classesOf('[data-cratis-part="value"]').should.deep.equal(['cratis-property__value sample-value']);
        classesOf('[data-cratis-part="message"]').should.include.members([
            'cratis-property__message sample-message',
            'cratis-property__message cratis-property__message--note sample-message',
        ]);
    });

    it('should_use_only_the_built_in_classes_without_parts', async () => {
        await mount.render(<Harness proposals={[]} messages={messages} />);

        classesOf('input, select').every((className) => className === 'cratis-property__input').should.equal(true);
        classesOf('[data-cratis-part="label"]').every((className) => className === 'cratis-property__label').should.equal(true);
        classesOf('[data-cratis-part="value"]').should.deep.equal(['cratis-property__value']);
    });

    it('should_mark_controls_with_messages_as_invalid', async () => {
        await mount.render(<Harness proposals={[]} messages={messages} />);

        const controls = Array.from(mount.container.querySelectorAll('input, select'));
        controls.map((control) => control.getAttribute('data-invalid')).should.deep.equal(['true', 'true', null, 'true', 'true', null, null]);
        controls.map((control) => control.getAttribute('aria-invalid')).should.deep.equal(['true', 'true', null, 'true', 'true', null, null]);
    });

    it('should_offer_an_unlisted_host_value_before_the_known_options', async () => {
        await mount.render(<Harness proposals={[]} initial={{ align: 'stretch' }} />);

        const options = Array.from(mount.container.querySelectorAll('select option')).map((option) => option.getAttribute('value'));
        options.should.deep.equal(['', 'stretch', 'start', 'center']);
    });

    it('should_not_offer_an_empty_or_known_host_value_twice', async () => {
        await mount.render(<Harness proposals={[]} initial={{ align: 'start' }} />);

        const options = Array.from(mount.container.querySelectorAll('select option')).map((option) => option.getAttribute('value'));
        options.should.deep.equal(['', 'start', 'center']);
    });
});

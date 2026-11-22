// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import type { JsonSchema } from '../../../types/JsonSchema';
import { Mount } from './Mount';

should();

describe('when a rejected property rename loses focus', () => {
    const mount = new Mount();
    const changes: JsonSchema[] = [];

    beforeEach(async () => {
        mount.setup();
        changes.length = 0;
        await mount.render(<SchemaEditor layout='tree' schema={{ type: 'object', properties: { title: { type: 'string' } } }} onChange={next => changes.push(next)} />);
        await mount.doubleClick(mount.control('title', 'name'));
        const input = mount.parts('nameInput')[0] as HTMLInputElement;
        await mount.type(input, '   ');
        await mount.key(input, 'Enter');
        await act(async () => { input.focus(); input.blur(); });
    });
    afterEach(() => mount.teardown());

    it('should stop editing without changing the property', () => {
        mount.parts('nameInput').should.have.length(0);
        mount.names().should.deep.equal(['title']);
        changes.should.have.length(0);
    });

    it('should discard the old draft and problem when editing starts again', async () => {
        await mount.doubleClick(mount.control('title', 'name'));
        const input = mount.parts('nameInput')[0] as HTMLInputElement;
        input.value.should.equal('title');
        input.hasAttribute('aria-invalid').should.equal(false);
        mount.parts('message').should.have.length(0);
    });
});

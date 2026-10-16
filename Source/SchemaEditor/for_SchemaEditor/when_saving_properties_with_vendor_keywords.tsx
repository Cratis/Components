// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';
import { TableMount } from './TableMount';

const schema = {
    type: 'object', properties: { sample: { type: 'string', 'x-sample': { values: [1, false] }, 'x-generated': true } },
} as unknown as JsonSchema;

describe('when editing and saving a table property with vendor keywords', () => {
    let mount: TableMount;
    let changes: JsonSchema[];
    let saves: number;
    beforeEach(async () => {
        mount = new TableMount();
        changes = [];
        saves = 0;
        await mount.render(<SchemaEditor schema={schema} editMode onChange={next => changes.push(next)} onSave={() => { saves++; }} />);
        await mount.type(mount.input('Property name'), 'renamed');
        await mount.click(mount.button('Save'));
    });
    afterEach(() => mount.unmount());
    it('should retain vendor keywords on the renamed property', () => changes[changes.length - 1].properties!.renamed.should.deep.equal(schema.properties!.sample));
    it('should save the edited schema', () => saves.should.equal(1));
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import { useSchemaEditorContext } from '../SchemaEditorContext';
import { Mount } from './Mount';

const EditTwice = () => {
    const { properties, operations } = useSchemaEditorContext();
    const propertyId = properties[0].id;
    return (
        <button type='button' data-testid='edit-twice' onClick={() => {
            operations.rename!(propertyId, 'renamed');
            operations.remove!(propertyId);
        }}>
            Edit twice
        </button>
    );
};

describe('when applying owned edits in one event', () => {
    const mount = new Mount();
    let notifications: string[];
    let sources: Array<string | undefined>;

    beforeEach(async () => {
        mount.setup();
        notifications = [];
        sources = [];
        await mount.render(
            <SchemaEditor
                layout='tree'
                schema={{ type: 'object', properties: { first: { type: 'string' }, second: { type: 'number' } } }}
                header={<EditTwice />}
                onChange={(schema, change) => {
                    notifications.push(`schema:${Object.keys(schema.properties!).join(',')}`);
                    sources.push(change?.source);
                }}
                onPropertiesChange={properties => notifications.push(`properties:${properties.map(property => property.name).join(',')}`)}
                onPropertyRenamed={(property, previousName) => notifications.push(`rename:${previousName}:${property.name}`)}
                onPropertyRemoved={property => notifications.push(`remove:${property.name}`)} />);
        await mount.click(document.querySelector<HTMLElement>('[data-testid="edit-twice"]')!);
    });

    afterEach(() => mount.teardown());

    it('should notify schema and property changes before each edit notification', () => {
        expect(notifications).to.deep.equal([
            'schema:renamed,second',
            'properties:renamed,second',
            'rename:first:renamed',
            'schema:second',
            'properties:second',
            'remove:renamed',
        ]);
    });

    it('should report each change as user initiated', () => {
        expect(sources).to.deep.equal(['user', 'user']);
    });

    it('should apply the second edit to the tree produced by the first', () => {
        expect(mount.names()).to.deep.equal(['second']);
    });
});

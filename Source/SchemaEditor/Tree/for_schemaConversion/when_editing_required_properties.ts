// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import {
    addChildProperty, addProperty, changePropertyType, propertiesToJsonSchema,
    removeProperty, renameProperty, setKeyProperty, setRequiredProperty,
} from '../schemaConversion';

function propertyTree(): Property[] {
    return [
        { id: 'root', name: 'name', type: PropertyType.String, isRequired: true },
        {
            id: 'parent', name: 'details', type: PropertyType.Object, isRequired: true,
            children: [
                { id: 'child', name: 'value', type: PropertyType.String, isRequired: true, isKey: true, concept: 'Value' },
                { id: 'sibling', name: 'note', type: PropertyType.String },
            ],
        },
        {
            id: 'array', name: 'items', type: PropertyType.ObjectArray,
            children: [{ id: 'item', name: 'quantity', type: PropertyType.Number, isRequired: true }],
        },
    ];
}

describe('when renaming required properties', () => {
    it('should rename the root requirement without retaining its old name', () => {
        const schema = propertiesToJsonSchema(renameProperty(propertyTree(), 'root', 'Name'));
        schema.required!.should.deep.equal(['Name', 'details']);
        ('name' in schema.properties!).should.be.false;
    });

    it('should rename only the corresponding containing object requirement', () => {
        const schema = propertiesToJsonSchema(renameProperty(propertyTree(), 'child', 'Value'));
        schema.properties!.details.required!.should.deep.equal(['Value']);
        schema.required!.should.deep.equal(['name', 'details']);
        schema.properties!.items.items!.required!.should.deep.equal(['quantity']);
    });

    it('should rename an object array item requirement', () => {
        const schema = propertiesToJsonSchema(renameProperty(propertyTree(), 'item', 'count'));
        schema.properties!.items.items!.required!.should.deep.equal(['count']);
    });
});

describe('when deleting required properties', () => {
    it('should remove the root requirement with the property', () => {
        propertiesToJsonSchema(removeProperty(propertyTree(), 'root')).required!.should.deep.equal(['details']);
    });

    it('should remove a nested requirement without unrequiring its parent', () => {
        const schema = propertiesToJsonSchema(removeProperty(propertyTree(), 'child'));
        ('required' in schema.properties!.details).should.be.false;
        schema.required!.should.deep.equal(['name', 'details']);
    });

    it('should remove an object array item requirement', () => {
        const schema = propertiesToJsonSchema(removeProperty(propertyTree(), 'item'));
        ('required' in schema.properties!.items.items!).should.be.false;
    });

    it('should remove a deleted parent and its child requirements', () => {
        const schema = propertiesToJsonSchema(removeProperty(propertyTree(), 'parent'));
        schema.required!.should.deep.equal(['name']);
        ('details' in schema.properties!).should.be.false;
    });
});

describe('when changing a required property type', () => {
    it('should keep the root presence requirement', () => {
        const schema = propertiesToJsonSchema(changePropertyType(propertyTree(), 'root', PropertyType.Number, 'Amount'));
        schema.required!.should.deep.equal(['name', 'details']);
        schema.properties!.name.type!.should.equal('number');
    });

    it('should keep the nested presence requirement', () => {
        const schema = propertiesToJsonSchema(changePropertyType(propertyTree(), 'child', PropertyType.Boolean));
        schema.properties!.details.required!.should.deep.equal(['value']);
    });

    it('should keep child requirements when changing an object to an object array', () => {
        const schema = propertiesToJsonSchema(changePropertyType(propertyTree(), 'parent', PropertyType.ObjectArray));
        schema.required!.should.deep.equal(['name', 'details']);
        schema.properties!.details.items!.required!.should.deep.equal(['value']);
    });

    it('should keep child requirements when changing an object array to an object', () => {
        const schema = propertiesToJsonSchema(changePropertyType(propertyTree(), 'array', PropertyType.Object));
        schema.properties!.items.required!.should.deep.equal(['quantity']);
    });

    it('should discard children on a deliberate primitive type change but keep the parent requirement', () => {
        const schema = propertiesToJsonSchema(changePropertyType(propertyTree(), 'parent', PropertyType.String));
        schema.required!.should.deep.equal(['name', 'details']);
        schema.properties!.details.should.deep.equal({ type: 'string' });
    });
});

describe('when explicitly setting schema requiredness', () => {
    let original: Property[];
    let result: Property[];
    beforeEach(() => {
        original = propertyTree();
        original.forEach(property => {
            property.children?.forEach(Object.freeze);
            if (property.children) Object.freeze(property.children);
            Object.freeze(property);
        });
        Object.freeze(original);
        result = setRequiredProperty(original, 'child', false);
    });

    it('should change exactly the target flag without mutating the input', () => {
        result.should.deep.equal([
            original[0],
            { ...original[1], children: [{ ...original[1].children![0], isRequired: false }, original[1].children![1]] },
            original[2],
        ]);
        original[1].children![0].isRequired!.should.be.true;
    });

    it('should not change the identifier or concept', () => {
        result[1].children![0].isKey!.should.be.true;
        result[1].children![0].concept!.should.equal('Value');
    });

    it('should allow setting a previously optional nested sibling', () => {
        const schema = propertiesToJsonSchema(setRequiredProperty(result, 'sibling', true));
        schema.properties!.details.required!.should.deep.equal(['note']);
    });

    it('should set rather than invert on repeated calls', () => {
        setRequiredProperty(result, 'child', false).should.deep.equal(result);
    });

    it('should leave values unchanged when the target is absent', () => {
        setRequiredProperty(original, 'missing', true).should.deep.equal(original);
    });

    it('should keep child requirements when unrequiring their parent', () => {
        const schema = propertiesToJsonSchema(setRequiredProperty(original, 'parent', false));
        schema.required!.should.deep.equal(['name']);
        schema.properties!.details.required!.should.deep.equal(['value']);
    });

    it('should allow unrequiring an array item property without affecting other objects', () => {
        const schema = propertiesToJsonSchema(setRequiredProperty(original, 'item', false));
        ('required' in schema.properties!.items.items!).should.be.false;
        schema.properties!.details.required!.should.deep.equal(['value']);
    });

    it('should not infer requiredness when selecting a key', () => {
        const schema = propertiesToJsonSchema(setKeyProperty(original, 'sibling'));
        schema.properties!.details.required!.should.deep.equal(['value']);
    });
});

describe('when adding properties', () => {
    for (const type of Object.values(PropertyType)) {
        it(`should leave a new ${type} property optional`, () => {
            const result = addProperty(propertyTree(), type, 6);
            (result[result.length - 1].isRequired === true).should.be.false;
            propertiesToJsonSchema(result).required!.should.deep.equal(['name', 'details']);
        });
    }

    it('should leave a concept property optional', () => {
        const result = addProperty([], PropertyType.String, 0, 'OrderId');
        ('required' in propertiesToJsonSchema(result)).should.be.false;
    });

    it('should leave new nested and object array item properties optional', () => {
        const nested = addChildProperty(propertyTree(), 'parent', PropertyType.String, 6, 'OrderId');
        const result = addChildProperty(nested, 'array', PropertyType.Number, 7);
        const schema = propertiesToJsonSchema(result);
        schema.properties!.details.required!.should.deep.equal(['value']);
        schema.properties!.items.items!.required!.should.deep.equal(['quantity']);
    });
});

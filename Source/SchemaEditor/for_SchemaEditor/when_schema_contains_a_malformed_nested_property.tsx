// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema, JsonSchemaProperty } from '../../types/JsonSchema';

/**
 * Regression coverage for a confirmed bypass: `cloneSchema` only checked that the
 * root of a JSON-round-tripped schema was a plain object, so a nested property
 * value such as `properties.foo: null` (JSON-valid, but not a usable schema
 * fragment) passed the clone check unrejected. Later code (`property.type || ...`
 * while iterating `Object.entries(targetSchema.properties)`) then dereferenced
 * that `null` and crashed instead of surfacing the existing invalid-schema
 * message. Nested `properties` values and `items` schemas must be validated
 * recursively, not just the root.
 */
describe('when the schema contains a malformed nested property', () => {
    let container: HTMLDivElement;
    let root: Root;

    const schemaWithMalformedNestedProperty: JsonSchema = {
        type: 'object',
        properties: {
            title: { type: 'string' },
            // SAFETY: intentionally malformed to prove nested clone validation rejects it.
            foo: null as unknown as JsonSchemaProperty,
        },
    };

    beforeEach(async () => {
        // SAFETY: React exposes this test-only flag on globalThis without a declaration.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom omits ResizeObserver, so the spec supplies the minimal API used here.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };

        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <SchemaEditor
                    schema={schemaWithMalformedNestedProperty}
                    editMode
                    labels={{ invalidJson: 'Schema JSON is invalid' }}
                />,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should not crash while rendering', () => {
        expect(container.querySelector('.schema-editor')).not.to.equal(null);
    });

    it('should expose the invalid-schema message as an accessible alert instead of throwing', () => {
        const alert = container.querySelector('[role="alert"]');
        expect(alert?.querySelector('[data-cratis-part="text"]')?.textContent).to.equal(
            'Schema JSON is invalid',
        );
    });

    it('should disable saving', () => {
        const saveButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent?.includes('Save'),
        );
        expect(saveButton?.disabled).to.equal(true);
    });

    it('should recover and preserve valid sibling data once the malformed value is fixed', async () => {
        const correctedSchema: JsonSchema = {
            type: 'object',
            properties: {
                title: { type: 'string' },
                foo: { type: 'string' },
            },
        };

        await act(async () => {
            root.render(<SchemaEditor schema={correctedSchema} editMode />);
        });

        expect(container.querySelector('[role="alert"]')).to.equal(null);
        const propertyNameInputs = Array.from(
            container.querySelectorAll<HTMLInputElement>(
                'input[aria-label="Property name"]',
            ),
        ).map((input) => input.value);
        expect(propertyNameInputs).to.deep.equal(['title', 'foo']);
        const saveButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent?.includes('Save'),
        );
        expect(saveButton?.disabled).to.equal(false);
    });
});

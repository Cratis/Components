// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';

/**
 * Regression coverage for two confirmed defects in required-property semantics:
 *
 * 1. `required` is tracked per object schema, not globally: a nested `object`
 *    property's `required` array only names its own properties. Renaming a
 *    property inside a nested object must never touch the root schema's
 *    `required` array (or any sibling's), even when a property elsewhere
 *    happens to share the old or new name.
 * 2. Renaming a required property must update the `required` array to the new
 *    name, not leave it pointing at a name that no longer exists in `properties`.
 */
describe('when renaming a required property in a nested object', () => {
    let container: HTMLDivElement;
    let root: Root;
    let capturedSchema: JsonSchema | undefined;

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            id: { type: 'string' },
            address: {
                type: 'object',
                properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                },
                required: ['street'],
            },
        },
        required: ['id', 'address'],
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

        capturedSchema = undefined;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <SchemaEditor
                    schema={schema}
                    onChange={(updated) => {
                        capturedSchema = updated;
                    }}
                />,
            );
        });

        // Navigate into the nested "address" object (read-only mode navigation).
        const addressRow = Array.from(
            container.querySelectorAll<HTMLTableRowElement>('[data-cratis-part="row"]'),
        ).find((row) => row.textContent?.includes('address'));
        if (!addressRow) throw new Error('SchemaEditor did not render the address row.');
        await act(async () => addressRow.click());

        // Switch to edit mode without losing the nested navigation path.
        const editButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent?.includes('Edit'),
        );
        if (!editButton) throw new Error('SchemaEditor did not render an Edit action.');
        await act(async () => editButton.click());

        const streetInput = Array.from(
            container.querySelectorAll<HTMLInputElement>(
                'input[aria-label="Property name"]',
            ),
        ).find((input) => input.value === 'street');
        if (!streetInput)
            throw new Error('SchemaEditor did not render the street input.');

        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(streetInput, 'id');
            streetInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should rename the property within the nested schema', () => {
        // Renaming re-inserts the new key at the end of the properties map and
        // removes the old one, so 'city' now precedes the renamed 'id'.
        const addressProperties = capturedSchema?.properties?.address.properties ?? {};
        expect(Object.keys(addressProperties)).to.deep.equal(['city', 'id']);
    });

    it("should update the nested object's own required array to the new name", () => {
        expect(capturedSchema?.properties?.address.required).to.deep.equal(['id']);
    });

    it("should never touch the root schema's required array, even given a colliding name", () => {
        expect(capturedSchema?.required).to.deep.equal(['id', 'address']);
    });

    it('should leave the root-level sibling property untouched', () => {
        expect(capturedSchema?.properties?.id).to.deep.equal({ type: 'string' });
    });
});

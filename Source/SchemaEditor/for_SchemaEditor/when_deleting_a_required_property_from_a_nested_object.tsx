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
 * Regression coverage: deleting a required property inside a nested object must
 * remove it from that object's own `required` array as well as from
 * `properties`. Before this fix, `removeProperty` only touched `properties`,
 * leaving `required` stale and pointing at a property that no longer exists.
 * The parent (root) schema's `required` array, which is a separate scope, must
 * be left untouched by a nested delete.
 */
describe('when deleting a required property from a nested object', () => {
    let container: HTMLDivElement;
    let root: Root;
    let capturedSchema: JsonSchema | undefined;

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            address: {
                type: 'object',
                properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                },
                required: ['street', 'city'],
            },
        },
        required: ['address'],
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

        const addressRow = Array.from(
            container.querySelectorAll<HTMLTableRowElement>('[data-cratis-part="row"]'),
        ).find((row) => row.textContent?.includes('address'));
        if (!addressRow) throw new Error('SchemaEditor did not render the address row.');
        await act(async () => addressRow.click());

        const editButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent?.includes('Edit'),
        );
        if (!editButton) throw new Error('SchemaEditor did not render an Edit action.');
        await act(async () => editButton.click());

        const streetRow = Array.from(
            container.querySelectorAll<HTMLTableRowElement>('[data-cratis-part="row"]'),
        ).find(
            (row) =>
                row.querySelector<HTMLInputElement>('input[aria-label="Property name"]')
                    ?.value === 'street',
        );
        if (!streetRow) throw new Error('SchemaEditor did not render the street row.');
        const deleteButton = streetRow.querySelector<HTMLButtonElement>(
            'button[aria-label="Delete property"]',
        );
        if (!deleteButton) {
            throw new Error('SchemaEditor did not render a delete button for street.');
        }

        await act(async () => deleteButton.click());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should remove the deleted property from the nested properties map', () => {
        const addressProperties = capturedSchema?.properties?.address.properties ?? {};
        expect(Object.keys(addressProperties)).to.deep.equal(['city']);
    });

    it("should remove the deleted property from the nested object's own required array", () => {
        expect(capturedSchema?.properties?.address.required).to.deep.equal(['city']);
    });

    it("should leave the root schema's required array untouched", () => {
        expect(capturedSchema?.required).to.deep.equal(['address']);
    });
});

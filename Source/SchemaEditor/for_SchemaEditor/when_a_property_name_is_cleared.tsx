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
 * Regression coverage for a confirmed bypass: `validateAllProperties` skipped
 * validation entirely for a falsy `prop.name` (`if (!prop.name) return;`), so
 * clearing a property's name to an empty string never produced a validation
 * error, leaving Save enabled and allowing a schema with an empty property key
 * to be saved. `validatePropertyName` already rejects empty names correctly;
 * the bug was that the caller never invoked it for that case.
 */
describe('when a property name is cleared', () => {
    let container: HTMLDivElement;
    let root: Root;

    const schema: JsonSchema = {
        type: 'object',
        properties: {
            title: { type: 'string' },
        },
    };

    const findSaveButton = () =>
        Array.from(container.querySelectorAll('button')).find((button) =>
            button.textContent?.includes('Save'),
        );

    // Query fresh each time rather than caching a node reference: the data
    // table may reconcile a new element for the cell across re-renders.
    const findNameInput = () =>
        container.querySelector<HTMLInputElement>('input[aria-label="Property name"]');

    const setValue = (input: HTMLInputElement, value: string) => {
        const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )!.set!;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
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
            root.render(<SchemaEditor schema={schema} editMode />);
        });

        const initialInput = findNameInput();
        if (!initialInput) throw new Error('SchemaEditor did not render the name input.');

        await act(async () => setValue(initialInput, ''));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should mark the cleared name input as invalid', () => {
        expect(findNameInput()?.getAttribute('aria-invalid')).to.equal('true');
    });

    it('should disable saving while a property name is empty', () => {
        expect(findSaveButton()?.disabled).to.equal(true);
    });

    it('should re-enable saving once a non-empty name is supplied', async () => {
        const clearedInput = findNameInput();
        if (!clearedInput) throw new Error('SchemaEditor did not render the name input.');
        await act(async () => setValue(clearedInput, 'restoredName'));

        expect(findNameInput()?.getAttribute('aria-invalid')).to.equal(null);
        expect(findSaveButton()?.disabled).to.equal(false);
    });
});

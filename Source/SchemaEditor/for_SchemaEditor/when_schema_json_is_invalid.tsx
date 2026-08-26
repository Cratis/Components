// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';

describe('when schema JSON is invalid', () => {
    let container: HTMLDivElement;
    let root: Root;

    const invalidSchema: JsonSchema = { type: 'object', properties: {} };
    Reflect.set(invalidSchema, 'self', invalidSchema);

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
                    schema={invalidSchema}
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

    it('should expose the localized validation message as an alert', () => {
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

    it('should recover when valid JSON is supplied', async () => {
        const validSchema: JsonSchema = {
            type: 'object',
            properties: {
                title: { type: 'string' },
            },
        };

        await act(async () => {
            root.render(<SchemaEditor schema={validSchema} editMode />);
        });

        expect(container.querySelector('[role="alert"]')).to.equal(null);
        const propertyNameInput = container.querySelector<HTMLInputElement>(
            'input[aria-label="Property name"]',
        );
        expect(propertyNameInput?.value).to.equal('title');
        const saveButton = Array.from(container.querySelectorAll('button')).find(
            (button) => button.textContent?.includes('Save'),
        );
        expect(saveButton?.disabled).to.equal(false);
    });
});

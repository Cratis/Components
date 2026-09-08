// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';

const schema: JsonSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
    },
};

describe('when cancelling SchemaEditor edit mode', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onChange = vi.fn();

    const buttonNamed = (name: string) => {
        const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
            candidate.textContent?.includes(name),
        );
        if (!button) throw new Error(`SchemaEditor did not render the ${name} action.`);
        return button;
    };

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
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
        onChange.mockClear();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(<SchemaEditor schema={schema} onChange={onChange} />);
        });
        await act(async () => buttonNamed('Edit').click());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should not emit a reset when nothing changed', async () => {
        await act(async () => buttonNamed('Cancel').click());
        expect(onChange.mock.calls).to.have.lengthOf(0);
    });

    it('should emit the restored schema with reset metadata after an edit', async () => {
        const nameInput = container.querySelector<HTMLInputElement>(
            'input[aria-label="Property name"]',
        );
        if (!nameInput) throw new Error('SchemaEditor did not render the property name input.');
        await act(async () => {
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
            )!.set!;
            setValue.call(nameInput, 'displayName');
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
        expect(onChange.mock.calls).to.have.lengthOf(1);
        expect(onChange.mock.calls[0][1]).to.deep.equal({ source: 'user' });

        await act(async () => buttonNamed('Cancel').click());
        expect(onChange.mock.calls).to.have.lengthOf(2);
        expect(onChange.mock.calls[1][0]).to.deep.equal(schema);
        expect(onChange.mock.calls[1][1]).to.deep.equal({ source: 'reset' });
    });
});

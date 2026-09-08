// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { ObjectContentEditor } from '../ObjectContentEditor';
import type { Json } from '../../types/JsonSchema';

const longText = 'A long description whose length deliberately exceeds fifty characters.';
const object: Json = {
    enabled: false,
    quantity: 2,
    name: 'Original',
    description: longText,
    dueDate: '2026-08-27',
};

const schema = {
    type: 'object' as const,
    properties: {
        enabled: { type: 'boolean' as const },
        quantity: { type: 'number' as const },
        name: { type: 'string' as const },
        description: { type: 'string' as const },
        dueDate: { type: 'string' as const, format: 'date' },
    },
};

describe('when editing ObjectContentEditor values', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onChange = vi.fn();

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        onChange.mockClear();
        await act(async () => {
            root.render(
                <ObjectContentEditor
                    object={object}
                    schema={schema}
                    editMode
                    onChange={onChange}
                />,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const setInputValue = async (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
        await act(async () => {
            const prototype = element instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
            const setValue = Object.getOwnPropertyDescriptor(prototype, 'value')!.set!;
            setValue.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
        });
    };

    const expectUserChange = (property: string, value: unknown) => {
        expect(onChange.mock.calls).to.have.lengthOf(1);
        expect(onChange.mock.calls[0][0]).to.deep.equal({ ...object, [property]: value });
        expect(onChange.mock.calls[0][1]).to.include({ source: 'user' });
        expect(onChange.mock.calls[0][1].nativeEvent).to.be.instanceOf(Event);
    };

    it('should emit a boolean value rather than a React event wrapper', async () => {
        const checkbox = container.querySelector<HTMLInputElement>('input[aria-label="enabled"]');
        if (!checkbox) throw new Error('Boolean editor was not rendered.');
        await act(async () => checkbox.click());
        expectUserChange('enabled', true);
    });

    it('should emit a numeric value rather than input text', async () => {
        const input = container.querySelector<HTMLInputElement>('input[aria-label="quantity"]');
        if (!input) throw new Error('Number editor was not rendered.');
        await setInputValue(input, '42');
        expectUserChange('quantity', 42);
    });

    it('should emit short text with native metadata', async () => {
        const input = container.querySelector<HTMLInputElement>('input[aria-label="name"]');
        if (!input) throw new Error('Text editor was not rendered.');
        await setInputValue(input, 'Updated');
        expectUserChange('name', 'Updated');
    });

    it('should emit long text with native metadata', async () => {
        const textarea = container.querySelector<HTMLTextAreaElement>(
            'textarea[aria-label="description"]',
        );
        if (!textarea) throw new Error('Long-text editor was not rendered.');
        await setInputValue(textarea, 'Updated long description');
        expectUserChange('description', 'Updated long description');
    });

    it('should preserve DatePicker semantic values and metadata', async () => {
        const trigger = container.querySelector<HTMLButtonElement>(
            '[data-cratis-part="trigger"]',
        );
        if (!trigger) throw new Error('Date editor was not rendered.');
        await act(async () => trigger.click());
        const calendarCell = Array.from(
            document.querySelectorAll<HTMLElement>('[data-cratis-part="cell"]'),
        )
            .map((cell) => cell.querySelector<HTMLElement>('[role="button"]') ?? cell)
            .find(
                (cell) =>
                    cell.getAttribute('aria-selected') !== 'true' &&
                    cell.getAttribute('aria-disabled') !== 'true',
            );
        if (!calendarCell) throw new Error('Date editor did not render an available calendar cell.');
        await act(async () => calendarCell.click());
        expect(onChange.mock.calls).to.have.lengthOf(1);
        expect(onChange.mock.calls[0][0].dueDate).to.be.a('string');
        expect(onChange.mock.calls[0][1]).to.deep.equal({ source: 'user' });
    });
});

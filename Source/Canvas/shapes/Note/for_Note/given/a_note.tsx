// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { vi } from 'vitest';
import { Note, type NoteProps } from '../../Note';
import { mountPrimitive } from '../../../../../Common/for_Primitives/given/a_primitive_dom';

export const mountNote = async (overrides: Partial<NoteProps> = {}) => {
    const props: NoteProps = {
        note: { id: 'sample-note', x: 10, y: 20, width: 200, height: 160, text: 'Sample note' },
        selected: true,
        onSelect: vi.fn(),
        onMove: vi.fn(),
        onMoveEnd: vi.fn(),
        onResize: vi.fn(),
        onResizeEnd: vi.fn(),
        onTextChange: vi.fn(),
        onExpandedChange: vi.fn(),
        ...overrides,
    };
    const mounted = await mountPrimitive(<Note {...props} />);
    const element = mounted.container.querySelector<HTMLDivElement>('.canvas-note')!;
    element.setPointerCapture = vi.fn();
    const handles = Array.from(element.querySelectorAll<HTMLDivElement>('.canvas-note__handle'));
    handles.forEach(handle => { handle.setPointerCapture = vi.fn(); });
    return { ...mounted, props, element, handles };
};

export const pointAt = async (
    element: HTMLElement,
    type: string,
    options: MouseEventInit = {},
) => {
    await act(async () => {
        const event = new MouseEvent(type, { bubbles: true, buttons: 1, ...options });
        Object.defineProperty(event, 'pointerId', { value: 1 });
        element.dispatchEvent(event);
    });
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { vi } from 'vitest';
import { Region, type RegionProps } from '../../Region';
import { mountPrimitive } from '../../../../../Common/for_Primitives/given/a_primitive_dom';

export const mountRegion = async (overrides: Partial<RegionProps> = {}) => {
    const props: RegionProps = {
        region: { id: 'sample-region', x: 10, y: 20, width: 200, height: 160, name: 'Example Region' },
        selected: true,
        onSelect: vi.fn(),
        onMove: vi.fn(),
        onMoveEnd: vi.fn(),
        onResize: vi.fn(),
        onResizeEnd: vi.fn(),
        onNameChange: vi.fn(),
        ...overrides,
    };
    const mounted = await mountPrimitive(<Region {...props} />);
    const element = mounted.container.querySelector<HTMLDivElement>('.canvas-region')!;
    const title = element.querySelector<HTMLDivElement>('.canvas-region__title-bar')!;
    element.setPointerCapture = vi.fn();
    const handles = Array.from(element.querySelectorAll<HTMLDivElement>('.canvas-region__handle'));
    handles.forEach(handle => { handle.setPointerCapture = vi.fn(); });
    return { ...mounted, props, element, title, handles };
};

export const pointAt = async (element: HTMLElement, type: string, options: MouseEventInit = {}) => {
    await act(async () => {
        const event = new MouseEvent(type, { bubbles: true, buttons: 1, ...options });
        Object.defineProperty(event, 'pointerId', { value: 1 });
        element.dispatchEvent(event);
    });
};

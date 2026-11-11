// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dropdown, type DropdownProps } from '../Dropdown';

const options = [
    { label: 'One', value: 'one' },
    { label: 'Three', value: 'three' },
];

describe('when switching multiple on a filtered dropdown', () => {
    let container: HTMLDivElement;
    let root: Root;
    let before: HTMLInputElement | null;
    let after: HTMLInputElement | null;

    const render = async (props: Partial<DropdownProps<unknown>>) => {
        await act(async () => root.render(
            <Dropdown filter options={options} value={null} onChange={() => undefined} {...props} />,
        ));
    };
    const filter = () => container.querySelector<HTMLInputElement>('[data-cratis-part="filter"]');

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() { return undefined; }
            unobserve() { return undefined; }
            disconnect() { return undefined; }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render({ multiple: false });
        before = filter();
        await act(async () => before!.focus());
        await render({ multiple: true, value: [] });
        after = filter();
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should keep the same filter input node', () => {
        expect(after).to.equal(before);
    });

    it('should keep focus on the filter input', () => {
        expect(document.activeElement).to.equal(before);
    });
});

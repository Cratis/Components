// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi, type Mock } from 'vitest';
import { RangeHistogramFilter, type RangeHistogramFilterProps } from '../../RangeHistogramFilter';

export interface RenderedRangeHistogram {
    container: HTMLDivElement;
    onChange: Mock;
    render: (props?: Partial<RangeHistogramFilterProps>) => Promise<void>;
    query: <T extends HTMLElement = HTMLElement>(selector: string) => T;
    unmount: () => Promise<void>;
}

export const defaultRangeHistogramProps = {
    values: [10, 20, 30, 40, 50, 60, 70, 80, 90],
    min: 0,
    max: 100,
    buckets: 10,
    selectedRange: [20, 80] as [number, number],
};

export async function a_rendered_range_histogram(
    props: Partial<RangeHistogramFilterProps> = {},
): Promise<RenderedRangeHistogram> {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.append(container);
    const root: Root = createRoot(container);
    const onChange = vi.fn();

    const render = async (overrides: Partial<RangeHistogramFilterProps> = {}) => {
        await act(async () => {
            root.render(
                <RangeHistogramFilter
                    {...defaultRangeHistogramProps}
                    onChange={onChange}
                    {...props}
                    {...overrides}
                />,
            );
        });
    };

    await render();

    return {
        container,
        onChange,
        render,
        query: <T extends HTMLElement = HTMLElement>(selector: string) => {
            const element = container.querySelector<T>(selector);
            if (!element) throw new Error(`Missing element ${selector}`);
            return element;
        },
        unmount: async () => {
            await act(async () => root.unmount());
            container.remove();
        },
    };
}

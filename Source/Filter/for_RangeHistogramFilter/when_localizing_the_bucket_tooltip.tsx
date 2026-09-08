// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { RangeHistogramFilter } from '../RangeHistogramFilter';

/**
 * Regression coverage: a bar's tooltip hardcoded the English word `'items'` after the count,
 * with no way for a consumer to override it. `itemsLabel` makes that word overridable while
 * defaulting to the previous English text.
 */
describe('when localizing the bucket tooltip', () => {
    let container: HTMLDivElement;
    let root: Root;

    const renderWith = async (itemsLabel?: string) => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <RangeHistogramFilter
                    values={[1, 2, 3, 8]}
                    min={0}
                    max={10}
                    buckets={2}
                    selectedRange={null}
                    onChange={() => undefined}
                    itemsLabel={itemsLabel}
                />,
            );
        });
    };

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it("should default the tooltip's unit word to 'items'", async () => {
        await renderWith(undefined);
        const bar = container.querySelector<HTMLButtonElement>('.pv-histogram-bar');
        expect(bar?.title.endsWith('items')).to.equal(true);
    });

    it('should localize the tooltip unit word when overridden', async () => {
        await renderWith('elementer');
        const bar = container.querySelector<HTMLButtonElement>('.pv-histogram-bar');
        expect(bar?.title.endsWith('elementer')).to.equal(true);
        expect(bar?.title.endsWith('items')).to.equal(false);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { vi } from 'vitest';
import { PivotViewerMain } from '../../components/PivotViewerMain';
import type { GroupingResult, ItemId, LayoutResult } from '../../engine/types';

export interface SampleItem {
    name: string;
}

export interface ViewportSettings {
    isZooming?: boolean;
    selected?: boolean;
    zoomLevel?: number;
}

/** Renders {@link PivotViewerMain} with two sample cards and a fake viewport geometry. */
export class a_pivot_viewer_main {
    data: SampleItem[] = [{ name: 'Sample One' }, { name: 'Sample Two' }];
    onCardClick = vi.fn();
    onCloseDetail = vi.fn();
    containerRef = createRef<HTMLDivElement>();
    private host = document.createElement('div');
    private root: Root = createRoot(this.host);

    render(settings: ViewportSettings = {}, visibleIds: number[] = [0, 1]) {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        document.body.append(this.host);
        const layout = {
            positions: new Map<ItemId, { x: number; y: number }>([[0, { x: 10, y: 10 }], [1, { x: 100, y: 10 }]]),
            totalWidth: 300,
            totalHeight: 200,
            bucketWidths: [],
        } as unknown as LayoutResult;
        const grouping = { groups: [] } as unknown as GroupingResult;
        act(() => this.root.render(
            <PivotViewerMain<SampleItem>
                data={this.data} ready isLoading={false} loadingLabel='Loading' viewportLabel='Cards'
                visibleIds={Uint32Array.from(visibleIds)} grouping={grouping} layout={layout}
                cardWidth={50} cardHeight={40} zoomLevel={settings.zoomLevel ?? 1}
                scrollPosition={{ x: 0, y: 0 }} containerDimensions={{ width: 300, height: 200 }}
                selectedItem={settings.selected ? this.data[0] : null} hoveredGroupIndex={null}
                isZooming={settings.isZooming ?? false} viewMode='collection'
                cardRenderer={item => ({ title: item.name })} resolveId={(_, index) => index}
                dimensionFilter={{} as never}
                onCardClick={this.onCardClick} onPanStart={() => undefined} onPanMove={() => undefined}
                onPanEnd={() => undefined} onGroupHover={() => undefined} onAxisLabelClick={() => undefined}
                onCloseDetail={this.onCloseDetail}
                containerRef={this.containerRef} axisLabelsRef={createRef<HTMLDivElement>()} spacerRef={createRef<HTMLDivElement>()}
            />,
        ));
        const viewport = this.containerRef.current!;
        viewport.getBoundingClientRect = () => ({ left: 5, top: 5 } as DOMRect);
        Object.defineProperty(viewport, 'scrollLeft', { value: 20, configurable: true });
        Object.defineProperty(viewport, 'scrollTop', { value: 10, configurable: true });
    }

    click(clientX: number, clientY: number) {
        const event = new MouseEvent('click', { bubbles: true, clientX, clientY });
        act(() => { this.containerRef.current!.dispatchEvent(event); });
        return event;
    }

    hover(clientX: number, clientY: number) {
        act(() => { this.containerRef.current!.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX, clientY })); });
        return this.containerRef.current!.style.cursor;
    }

    unmount() {
        act(() => this.root.unmount());
        this.host.remove();
    }
}

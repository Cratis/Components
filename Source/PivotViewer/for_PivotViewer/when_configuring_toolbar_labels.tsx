// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it } from 'vitest';
import { PivotViewer } from '../PivotViewer';

const dimensions = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
const filters = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];

describe('when rendering PivotViewer with default toolbar labels', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(<PivotViewer data={[]} dimensions={dimensions} filters={filters} cardRenderer={() => ({ title: 'Sample item' })} />);
    });

    it('should preserve the existing toolbar copy and count', () => {
        html.should.include('0 events');
        html.should.include('title="Filters"');
        html.should.include('title="Zoom out"');
        html.should.include('aria-label="Zoom level"');
        html.should.include('title="Zoom: 100%"');
        html.should.include('title="Click to edit zoom level"');
        html.should.include('title="Reset zoom"');
        html.should.include('title="Zoom in"');
        html.should.include('Collection');
        html.should.include('Grouped');
        html.should.include('Sort by');
    });
});

describe('when overriding PivotViewer toolbar labels', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(
            <PivotViewer
                data={[]}
                dimensions={dimensions}
                filters={filters}
                cardRenderer={() => ({ title: 'Sample item' })}
                labels={{
                    filters: 'Narrow',
                    sortBy: 'Arrange by',
                    collection: 'Browse',
                    grouped: 'Categorized',
                    zoomOut: 'Smaller',
                    zoomLevel: 'Scale',
                    zoom: (percent) => `Scale: ${percent}%`,
                    editZoomLevel: 'Change scale',
                    resetZoom: 'Restore scale',
                    zoomIn: 'Larger',
                    itemCount: (count) => `${count} items`,
                }}
            />,
        );
    });

    it('should render the overridden toolbar copy', () => {
        html.should.include('0 items');
        html.should.include('title="Narrow"');
        html.should.include('title="Smaller"');
        html.should.include('aria-label="Scale"');
        html.should.include('title="Scale: 100%"');
        html.should.include('title="Change scale"');
        html.should.include('title="Restore scale"');
        html.should.include('title="Larger"');
        html.should.include('Browse');
        html.should.include('Categorized');
        html.should.include('Arrange by');
    });
});

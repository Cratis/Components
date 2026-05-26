// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { ToolbarFanOutItem } from '../../ToolbarFanOutItem';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
}));

describe('when ToolbarFanOutItem direction is set and item is rendered', () => {
    const render = (fanOutDirection?: 'left' | 'right' | 'up' | 'down') =>
        renderToStaticMarkup(
            React.createElement(
                ToolbarFanOutItem,
                {
                    icon: 'pi pi-th-large',
                    tooltip: 'Shapes',
                    fanOutDirection,
                },
                React.createElement('div', null, 'Child'),
            ),
        );

    it('should_default_to_right_direction', () => {
        const html = render();
        html.should.include('toolbar-fanout-panel--right');
    });

    it('should_support_up_direction', () => {
        const html = render('up');
        html.should.include('toolbar-fanout-panel--up');
    });

    it('should_support_down_direction', () => {
        const html = render('down');
        html.should.include('toolbar-fanout-panel--down');
    });
});

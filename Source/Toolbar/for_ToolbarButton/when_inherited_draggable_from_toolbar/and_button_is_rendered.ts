// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { Toolbar } from '../../Toolbar';
import { ToolbarButton } from '../../ToolbarButton';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
}));

describe('when ToolbarButton is inside a draggable Toolbar and is rendered', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(
            Toolbar,
            { draggable: true },
            React.createElement(ToolbarButton, {
                icon: 'pi pi-pencil',
                tooltip: 'Draw',
                data: { tool: 'pencil' },
            }),
        );
        html = renderToStaticMarkup(element);
    });

    it('should_render_button_with_draggable_attribute', () => {
        html.should.include('draggable="true"');
    });

    it('should_apply_the_draggable_css_class', () => {
        html.should.include('toolbar-button--draggable');
    });
});

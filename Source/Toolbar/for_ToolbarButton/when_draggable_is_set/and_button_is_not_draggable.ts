// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { ToolbarButton } from '../../ToolbarButton';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
}));

describe('when ToolbarButton does not have draggable set and is rendered', () => {
    let html: string;

    beforeEach(() => {
        const element = React.createElement(ToolbarButton, {
            icon: 'pi pi-pencil',
            title: 'Draw',
        });
        html = renderToStaticMarkup(element);
    });

    it('should_not_render_button_with_draggable_attribute', () => {
        html.should.not.include('draggable="true"');
    });

    it('should_not_apply_the_draggable_css_class', () => {
        html.should.not.include('toolbar-button--draggable');
    });
});

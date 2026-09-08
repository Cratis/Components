// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarFanOutItem } from '../ToolbarFanOutItem';
import { ToolbarFolder } from '../ToolbarFolder';

describe('when a ToolbarButton tooltip is enabled', () => {
    const icon = <span aria-hidden='true'>D</span>;
    const html = renderToStaticMarkup(
        <>
            <ToolbarButton icon={icon} title='Draw' />
            <ToolbarFolder icon={icon} title='More tools'>
                <ToolbarButton icon={icon} title='Nested tool' />
            </ToolbarFolder>
            <ToolbarFanOutItem icon={icon} tooltip='Shapes'>
                <ToolbarButton icon={icon} title='Shape' />
            </ToolbarFanOutItem>
        </>,
    );

    it('should_preserve_component_specific_parts', () => {
        expect(html).to.contain('data-cratis-part="button"');
        expect(html).to.contain('data-cratis-part="toolbar-folder-trigger"');
        expect(html).to.contain('data-cratis-part="fanout-trigger"');
    });

    it('should_mark_the_same_element_as_the_tooltip_trigger', () => {
        expect(html).to.contain('data-cratis-tooltip-trigger=""');
    });
});

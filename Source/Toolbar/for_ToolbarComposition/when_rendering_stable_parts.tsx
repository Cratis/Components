// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it, vi } from 'vitest';
import { Toolbar } from '../Toolbar';
import { ToolbarContext } from '../ToolbarContext';
import { ToolbarFolder } from '../ToolbarFolder';
import { ToolbarGroup } from '../ToolbarGroup';
import { ToolbarLayout } from '../ToolbarLayout';
import { ToolbarSection } from '../ToolbarSection';
import { ToolbarSeparator } from '../ToolbarSeparator';

vi.mock('../../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('when rendering Toolbar composition parts', () => {
    const html = renderToStaticMarkup(
        <Toolbar aria-label='Canvas tools'>
            <ToolbarGroup pt={{ root: { id: 'group' } }}>Group</ToolbarGroup>
            <ToolbarSeparator pt={{ root: { id: 'separator' } }} />
            <ToolbarLayout
                name='tools'
                pt={{
                    root: { id: 'layout' },
                    slot: { id: 'layout-slot' },
                    incoming: { id: 'layout-incoming' },
                }}
            >
                Layout
            </ToolbarLayout>
            <ToolbarSection
                activeContext='draw'
                pt={{
                    root: { id: 'section' },
                    context: { title: 'context' },
                }}
            >
                <ToolbarContext name='draw'>Draw</ToolbarContext>
                <ToolbarContext name='text'>Text</ToolbarContext>
            </ToolbarSection>
            <ToolbarFolder
                icon={<span aria-hidden='true'>F</span>}
                title='Tools'
                pt={{
                    root: { id: 'folder' },
                    trigger: { id: 'folder-trigger' },
                    panel: { id: 'folder-panel' },
                }}
            >
                <button type='button'>Nested action</button>
            </ToolbarFolder>
        </Toolbar>,
    );

    it('should_render_an_accessibly_named_toolbar', () => {
        expect(html).to.contain('role="toolbar"');
        expect(html).to.contain('aria-label="Canvas tools"');
    });

    it('should_expose_each_composition_boundary', () => {
        for (const part of [
            'toolbar-group',
            'toolbar-separator',
            'toolbar-layout',
            'toolbar-slot',
            'toolbar-slot-incoming',
            'toolbar-section',
            'toolbar-context',
            'toolbar-folder',
            'toolbar-folder-trigger',
            'toolbar-folder-panel',
        ]) {
            expect(html).to.contain(`data-cratis-part="${part}"`);
        }
    });

    it('should_forward_product_part_attributes', () => {
        for (const attribute of [
            'id="group"',
            'id="separator"',
            'id="layout"',
            'id="layout-slot"',
            'id="layout-incoming"',
            'id="section"',
            'title="context"',
            'id="folder"',
            'id="folder-trigger"',
            'id="folder-panel"',
        ]) {
            expect(html).to.contain(attribute);
        }
    });

    it('should_make_the_collapsed_folder_panel_inert', () => {
        expect(html).to.match(
            /data-cratis-part="toolbar-folder-panel"[^>]*aria-hidden="true"[^>]*inert=""/,
        );
    });
});

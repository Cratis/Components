// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, describe, it, vi } from 'vitest';
import { Canvas } from '../Canvas/Canvas';
import { CanvasMinimap } from '../Canvas/CanvasMinimap';
import { CanvasOverlay } from '../Canvas/CanvasOverlay';
import { CANVAS_SURFACE_CLASS } from '../Canvas/isClaimedByAnotherSurface';
import { nearestComponent } from '../ComponentPicker/componentElements';
import { ConfigurationEditor } from '../ConfigurationEditor/ConfigurationEditor';
import { Toaster } from '../Notifications/Toaster';
import { ObjectContentEditor } from '../ObjectContentEditor/ObjectContentEditor';
import { ObjectNavigationalBar } from '../ObjectNavigationalBar/ObjectNavigationalBar';
import { PivotViewer } from '../PivotViewer/PivotViewer';
import { SchemaEditor } from '../SchemaEditor/SchemaEditor';
import { EventsView } from '../TimeMachine/EventsView';
import type { JsonSchema } from '../types/JsonSchema';

// Exercise the real Canvas DOM without starting a GPU renderer in jsdom.
vi.mock('../Canvas/usePixiApplication', () => ({
    usePixiApplication: () => ({
        appRef: { current: null },
        worldRef: { current: null },
        spritesRef: { current: new Map() },
        pixiReady: false,
        render: () => undefined,
    }),
}));

const noop = () => undefined;
const schema: JsonSchema = { type: 'object', properties: { title: { type: 'string' } } };
const objectEditor = <ObjectContentEditor object={{ title: 'Example Project' }} schema={schema} />;
const schemaEditor = (layout: 'table' | 'tree') => (
    <SchemaEditor layout={layout} schema={{ type: 'object', properties: { date: { type: 'string', format: 'date' } } }} onChange={noop} header={<span id='example-schema-header'>Example schema</span>} />
);
const examples: Record<string, { element: React.ReactElement; marker: string; className: string }> = {
    Canvas: { element: <Canvas showControls={false}><span>Example canvas</span></Canvas>, marker: 'Canvas', className: CANVAS_SURFACE_CLASS },
    CanvasMinimap: { element: <CanvasMinimap />, marker: 'CanvasMinimap', className: 'canvas-minimap' },
    EventsView: { element: <EventsView events={[]} />, marker: 'EventsView', className: 'events-view-container' },
    ObjectContentEditor: { element: objectEditor, marker: 'ObjectContentEditor', className: 'order-content' },
    ObjectNavigationalBar: { element: <ObjectNavigationalBar navigationPath={[]} onNavigate={noop} />, marker: 'ObjectNavigationalBar', className: 'cratis-object-navigational-bar' },
    PivotViewer: { element: <PivotViewer data={[]} dimensions={[]} cardRenderer={() => ({ title: 'Example card' })} />, marker: 'PivotViewer', className: 'pivot-viewer' },
    SchemaEditorTable: { element: schemaEditor('table'), marker: 'SchemaEditor', className: 'schema-editor' },
    SchemaEditorTree: { element: schemaEditor('tree'), marker: 'SchemaEditor', className: 'cratis-schema-editor' },
};

let container: HTMLDivElement;
let root: Root;

const render = async (element: React.ReactElement) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(element));
};

const markedRoot = (name: string, parent: ParentNode = container) => {
    const marked = parent.querySelectorAll<HTMLElement>(`[data-cratis-component="${name}"]`);
    marked.length.should.equal(1);
    return marked[0];
};

beforeAll(() => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('ResizeObserver', class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    });
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

afterAll(() => vi.unstubAllGlobals());

describe('when rendering marked composite components', () => {
    for (const [name, example] of Object.entries(examples)) {
        it(`should mark the existing ${name} root without wrapping it`, async () => {
            await render(example.element);
            const marked = markedRoot(example.marker);
            marked.tagName.should.equal('DIV');
            marked.classList.contains(example.className).should.equal(true);
            (marked.parentElement === container).should.equal(true);
        });
    }

    it('should preserve object editor ownership outside its nested navigation and button', async () => {
        await render(objectEditor);
        const editor = markedRoot('ObjectContentEditor');
        const navigation = markedRoot('ObjectNavigationalBar');
        (nearestComponent(editor.querySelector('td')) === editor).should.equal(true);
        (nearestComponent(navigation.querySelector('div')) === navigation).should.equal(true);
        const button = markedRoot('Button');
        (nearestComponent(button.querySelector('svg')) === button).should.equal(true);
    });

    it('should preserve schema editor ownership outside its nested property type glyph', async () => {
        await render(schemaEditor('tree'));
        const editor = markedRoot('SchemaEditor');
        const glyph = markedRoot('PropertyTypeGlyph');
        editor.getAttribute('data-cratis-part')!.should.equal('root');
        (nearestComponent(editor.querySelector('#example-schema-header')) === editor).should.equal(true);
        (nearestComponent(glyph.firstElementChild) === glyph).should.equal(true);
    });

    it('should preserve canvas ownership outside its nested minimap', async () => {
        await render(<Canvas showControls={false}><span>Example canvas</span><CanvasMinimap /></Canvas>);
        const canvas = markedRoot('Canvas');
        const minimap = markedRoot('CanvasMinimap');
        (nearestComponent(canvas.querySelector('span')) === canvas).should.equal(true);
        (nearestComponent(minimap.firstElementChild) === minimap).should.equal(true);
    });

    it('should mark the existing toaster portal region without wrapping it', async () => {
        await render(<Toaster pt={{ region: { id: 'example-toaster', className: 'example-region' } }} />);
        const toaster = markedRoot('Toaster', document.body);
        (toaster.parentElement === document.body).should.equal(true);
        container.children.length.should.equal(0);
        toaster.tagName.should.equal('DIV');
        toaster.id.should.equal('example-toaster');
        toaster.classList.contains('cratis-toaster').should.equal(true);
        toaster.classList.contains('example-region').should.equal(true);
        toaster.getAttribute('data-cratis-part')!.should.equal('region');
        toaster.getAttribute('role')!.should.equal('region');
    });

    it('should keep the canvas overlay rootless without marking caller content', async () => {
        await render(<CanvasOverlay><span id='example-overlay'>Example overlay</span></CanvasOverlay>);
        const overlay = document.getElementById('example-overlay')!;
        (overlay.parentElement === document.body).should.equal(true);
        overlay.hasAttribute('data-cratis-component').should.equal(false);
        container.children.length.should.equal(0);
    });

    it('should keep the configuration editor fallback rootless', async () => {
        await render(<ConfigurationEditor componentType='example-component' value={{}} onChange={noop} fallback={objectEditor} />);
        (markedRoot('ObjectContentEditor').parentElement === container).should.equal(true);
        container.querySelectorAll('[data-cratis-component="ConfigurationEditor"]').length.should.equal(0);
    });
});

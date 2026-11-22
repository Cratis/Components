// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { nearestComponent } from '../ComponentPicker/componentElements';
import { describeComponentElement } from '../ComponentPicker/describeComponentElement';
import { click, mountScreen, startPicking, unmountScreen, type ScreenInTheDom } from '../ComponentPicker/for_ComponentPicker/given/a_screen_in_the_dom';
import { previewPresentationChanges, registeredComponentFor } from '../configuration/identity/componentInstances';
import { GlyphMenu } from '../SchemaEditor/Tree/GlyphMenu';
import { PropertyType } from '../SchemaEditor/Tree/PropertyType';

const items = [
    { key: 1, label: 'Example Text', glyph: PropertyType.String },
    { key: 2, label: 'Example Number', glyph: PropertyType.Number },
];

describe('when rendering a marked glyph menu', () => {
    let screen: ScreenInTheDom;
    let trigger: HTMLButtonElement;
    const onChange = vi.fn();

    beforeEach(async () => {
        onChange.mockClear();
        screen = await mountScreen(<GlyphMenu items={items} value={1} onChange={onChange} label='Example type' name='example-type' />);
        trigger = screen.container.querySelector<HTMLButtonElement>('button')!;
    });

    afterEach(async () => unmountScreen(screen));

    it('should mark the existing trigger without wrapping or changing its presentation', () => {
        expect(trigger.parentElement).to.equal(screen.container);
        expect(trigger.className).to.equal('cratis-schema-editor__type-button');
        expect(trigger.textContent).to.equal('AaExample Text');
        expect(trigger.getAttribute('aria-label')).to.equal('Example type');
        expect(trigger.getAttribute('data-name')).to.equal('example-type');
        expect(trigger.disabled).to.equal(false);
        expect(describeComponentElement(trigger).component).to.equal('GlyphMenu');
        expect(describeComponentElement(trigger).id).to.equal('example-type');
        expect(registeredComponentFor(trigger)?.descriptor.properties.map(property => property.name)).to.deep.equal(['label']);
        const glyph = trigger.querySelector('[data-cratis-component="PropertyTypeGlyph"]')!;
        expect(nearestComponent(glyph)).to.equal(glyph);
    });

    it('should identify the portaled menu as the same instance and preserve item actions', async () => {
        await click(trigger);
        const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
        const popover = menu.closest('[data-cratis-component="GlyphMenu"]')!;
        expect(popover.className).to.equal('cratis-schema-editor__menu');
        expect(screen.container.contains(popover)).to.equal(false);
        expect(menu.className).to.equal('cratis-schema-editor__menu-list');
        expect(menu.getAttribute('aria-label')).to.equal('Example type');
        expect(nearestComponent(menu)).to.equal(popover);
        expect(describeComponentElement(popover).component).to.equal('GlyphMenu');
        expect(popover.getAttribute('data-cratis-component-instance')).to.equal(trigger.getAttribute('data-cratis-component-instance'));
        expect(registeredComponentFor(popover)).to.deep.equal(registeredComponentFor(trigger));
        const entries = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
        expect(entries.map(entry => entry.textContent)).to.deep.equal(['AaExample Text', '123Example Number']);
        expect(entries.every(entry => entry.className === 'cratis-schema-editor__menu-item')).to.equal(true);
        await click(entries[1]);
        expect(onChange.mock.calls).to.deep.equal([[2]]);
    });

    it('should preview only the accessible label on both roots and restore it on revert', async () => {
        const pending = await startPicking(screen);
        await click(trigger);
        const picked = (await pending.result)!;
        expect(picked.presentationProperties.map(property => property.name)).to.deep.equal(['label']);
        expect(picked.presentationProperties[0].value).to.equal('Example type');
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(trigger, [{ property: 'label', from: 'Example type', to: 'Preview type' }]);
        });
        expect(trigger.getAttribute('aria-label')).to.equal('Preview type');
        expect(trigger.textContent).to.equal('AaExample Text');
        await click(trigger);
        const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
        expect(menu.getAttribute('aria-label')).to.equal('Preview type');
        await act(async () => revert());
        expect(trigger.getAttribute('aria-label')).to.equal('Example type');
        expect(menu.getAttribute('aria-label')).to.equal('Example type');
        expect(onChange.mock.calls).to.deep.equal([]);
    });
});

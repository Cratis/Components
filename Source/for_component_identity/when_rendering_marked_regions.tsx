// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { mountRegion, pointAt } from '../Canvas/shapes/Region/for_Region/given/a_region';
import { nearestComponent } from '../ComponentPicker/componentElements';
import { describeComponentElement } from '../ComponentPicker/describeComponentElement';
import { unmountPrimitive } from '../Common/for_Primitives/given/a_primitive_dom';
import { PropertyType } from '../SchemaEditor/Tree/PropertyType';
import { PropertyTypeGlyph } from '../SchemaEditor/Tree/PropertyTypeGlyph';

describe('when rendering a marked region', () => {
    let mounted: Awaited<ReturnType<typeof mountRegion>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
    });

    it('should mark both existing sibling surfaces without changing their layout', async () => {
        mounted = await mountRegion({ children: <span>Example member</span> });
        const members = mounted.element.nextElementSibling!;
        expect(mounted.container.children.length).to.equal(2);
        expect(mounted.element.parentElement).to.equal(mounted.container);
        expect(members.parentElement).to.equal(mounted.container);
        expect(mounted.element.className).to.equal('canvas-region canvas-region--selected');
        expect(mounted.element.style.width).to.equal('200px');
        expect(mounted.element.style.height).to.equal('160px');
        expect(mounted.handles.length).to.equal(8);
        expect(members.className).to.equal('canvas-region__items');
        expect(members.textContent).to.equal('Example member');
        expect(nearestComponent(mounted.title)).to.equal(mounted.element);
        expect(nearestComponent(members.firstElementChild)).to.equal(members);
        expect(describeComponentElement(mounted.element).component).to.equal('Region');
        expect(describeComponentElement(members).component).to.equal('Region');
        expect(describeComponentElement(members).presentationProperties).to.deep.equal([]);
    });

    it('should preserve nested component ownership inside the member surface', async () => {
        mounted = await mountRegion({ selected: false, children: <PropertyTypeGlyph type={PropertyType.String} /> });
        const members = mounted.element.nextElementSibling!;
        const glyph = members.querySelector('[data-cratis-component="PropertyTypeGlyph"]')!;
        expect(mounted.element.className).to.equal('canvas-region');
        expect(mounted.handles.length).to.equal(0);
        expect(nearestComponent(glyph)).to.equal(glyph);
        expect(glyph.parentElement).to.equal(members);
        expect(members.getAttribute('data-cratis-component')).to.equal('Region');
    });

    it('should keep the editable label inside the same marked region root', async () => {
        mounted = await mountRegion();
        await pointAt(mounted.title, 'pointerdown');
        await pointAt(mounted.element, 'pointerup');
        await pointAt(mounted.title, 'dblclick');
        const input = mounted.element.querySelector<HTMLInputElement>('input')!;
        expect(input.defaultValue).to.equal('Example Region');
        expect(input.className).to.equal('canvas-region__name-input');
        expect(input.parentElement).to.equal(mounted.title);
        expect(nearestComponent(input)).to.equal(mounted.element);
        expect(mounted.container.querySelectorAll('[data-cratis-component="Region"]').length).to.equal(2);
    });
});

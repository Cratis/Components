// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import {
    knownComponentDescriptors,
    previewPresentationChanges,
    registeredComponentFor,
} from '../../configuration/identity/componentInstances';
import type { PresentationChange } from '../../configuration/identity/PresentationChange';
import { describeComponentElement } from '../describeComponentElement';
import { commonAndToolbarComponents } from './given/common_and_toolbar_components';
import { click, hover, mountScreen, startPicking, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

for (const example of commonAndToolbarComponents) {
    describe(`when picking a ${example.component}`, () => {
        let screen: ScreenInTheDom;
        let element: HTMLElement;

        beforeEach(async () => {
            screen = await mountScreen(<>{example.element}{example.element}</>);
            element = screen.container.querySelector<HTMLElement>(`[data-cratis-component="${example.component}"]`)!;
        });

        afterEach(async () => {
            screen.picker().cancel();
            await unmountScreen(screen);
        });

        it('should register only its typed presentation properties and allowed values', () => {
            registeredComponentFor(element)!.descriptor.properties.should.deep.equal(example.properties);
        });

        it('should make its static descriptor discoverable', () => {
            knownComponentDescriptors().find((descriptor) => descriptor.component === example.component)!
                .should.equal(registeredComponentFor(element)!.descriptor);
        });

        it('should report current values through the picker', async () => {
            const pending = await startPicking(screen);
            await hover(element);
            await click(element);
            const picked = (await pending.result)!;
            picked.component.should.equal(example.component);
            picked.presentationProperties.map(({ name, value, editable }) => ({ name, value, editable }))
                .should.deep.equal(Object.entries(example.current).map(([name, value]) => ({ name, value, editable: true })));
        });

        it('should read registered values rather than DOM attributes', () => {
            element.setAttribute('data-orientation', 'DOM-only');
            element.setAttribute('data-severity', 'DOM-only');
            element.setAttribute('aria-label', 'DOM-only');
            Object.fromEntries(describeComponentElement(element).presentationProperties.map(({ name, value }) => [name, value]))
                .should.deep.equal(example.current);
        });

        it('should preview and revert without changing registered props or another instance', async () => {
            const changes: PresentationChange[] = Object.entries(example.preview).map(([property, to]) => ({
                property, from: example.current[property], to,
            }));
            const original = registeredComponentFor(element)!.props;
            const other = screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${example.component}"]`)[1];
            let revert!: () => void;
            [example.read(element)].should.deep.equal([example.rendered]);
            await act(async () => { revert = previewPresentationChanges(element, changes); });
            [example.read(element)].should.deep.equal([example.previewed]);
            [example.read(other)].should.deep.equal([example.rendered]);
            registeredComponentFor(element)!.props.should.equal(original);
            Object.fromEntries(describeComponentElement(element).presentationProperties.map(({ name, value }) => [name, value]))
                .should.deep.equal(example.current);
            await act(async () => { revert(); revert(); });
            [example.read(element)].should.deep.equal([example.rendered]);
        });

        it('should preserve defaults while reporting unset props as editable', async () => {
            await act(async () => screen.root.render(example.defaults));
            const defaultElement = screen.container.querySelector<HTMLElement>(`[data-cratis-component="${example.component}"]`)!;
            [example.read(defaultElement)].should.deep.equal([example.defaultRendered]);
            describeComponentElement(defaultElement).presentationProperties.map(({ name, value, editable }) => ({ name, value, editable }))
                .should.deep.equal(example.properties.map(({ name }) => ({ name, value: undefined, editable: true })));
        });

        it('should unregister when unmounted', async () => {
            await act(async () => screen.root.render(<></>));
            [registeredComponentFor(element)].should.deep.equal([undefined]);
        });
    });
}

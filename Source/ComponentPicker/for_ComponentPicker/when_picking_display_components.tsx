// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { expect } from 'chai';
import { vi } from 'vitest';
import { Avatar } from '../../Display/Avatar';
import { Badge } from '../../Display/Badge';
import { Chip } from '../../Display/Chip';
import { ProgressSpinner } from '../../Display/ProgressSpinner';
import { Skeleton } from '../../Display/Skeleton';
import { Tag } from '../../Display/Tag';
import {
    knownComponentDescriptors,
    previewPresentationChanges,
    registeredComponentFor,
} from '../../configuration/identity/componentInstances';
import type { PresentationChange } from '../../configuration/identity/PresentationChange';
import { describeComponentElement } from '../describeComponentElement';
import { displayComponents } from './given/display_components';
import { click, hover, mountScreen, startPicking, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

for (const example of displayComponents) {
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

        it('should register exactly its typed presentation properties and allowed values', () => {
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

        it('should read props from the registry rather than DOM attributes', () => {
            element.setAttribute('data-size', 'DOM-only');
            element.setAttribute('data-severity', 'DOM-only');
            element.setAttribute('aria-label', 'DOM-only');
            Object.fromEntries(describeComponentElement(element).presentationProperties.map(({ name, value }) => [name, value]))
                .should.deep.equal(example.current);
        });

        it('should preview and revert without changing the registered props or another instance', async () => {
            const changes: PresentationChange[] = Object.entries(example.preview).map(([property, to]) => ({
                property, from: example.current[property], to,
            }));
            const original = registeredComponentFor(element)!.props;
            const other = screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${example.component}"]`)[1];
            let revert!: () => void;
            expect(example.read(element)).to.deep.equal(example.rendered);
            await act(async () => { revert = previewPresentationChanges(element, changes); });
            expect(example.read(element)).to.deep.equal(example.previewed);
            expect(example.read(other)).to.deep.equal(example.rendered);
            registeredComponentFor(element)!.props.should.equal(original);
            Object.fromEntries(describeComponentElement(element).presentationProperties.map(({ name, value }) => [name, value]))
                .should.deep.equal(example.current);
            await act(async () => { revert(); revert(); });
            expect(example.read(element)).to.deep.equal(example.rendered);
        });

        it('should unregister when unmounted', async () => {
            await act(async () => screen.root.render(<></>));
            expect(registeredComponentFor(element)).to.equal(undefined);
        });
    });
}

describe('when previewing display presentation details', () => {
    let screen: ScreenInTheDom;

    afterEach(async () => { await unmountScreen(screen); });

    it('should preserve the existing defaults when there is no preview', async () => {
        screen = await mountScreen(<><Avatar /><Badge /><Chip removable /><Tag /><Skeleton /><ProgressSpinner /></>);
        screen.container.querySelector('[data-cratis-component="Avatar"]')!.getAttribute('data-size')!.should.equal('normal');
        const badge = screen.container.querySelector('[data-cratis-component="Badge"]')!;
        badge.getAttribute('data-severity')!.should.equal('secondary');
        badge.getAttribute('data-size')!.should.equal('small');
        screen.container.querySelector('button')!.getAttribute('aria-label')!.should.equal('Remove');
        screen.container.querySelector('[data-cratis-component="Tag"]')!.getAttribute('data-severity')!.should.equal('secondary');
        const skeleton = screen.container.querySelector<HTMLElement>('[data-cratis-component="Skeleton"]')!;
        skeleton.style.width.should.equal('100%');
        skeleton.style.height.should.equal('1rem');
        screen.container.querySelector('[role="status"]')!.getAttribute('aria-label')!.should.equal('Loading');
        expect(describeComponentElement(badge).presentationProperties[0].value).to.equal(undefined);
    });

    it('should preview and revert image alternative text', async () => {
        screen = await mountScreen(<Avatar image='https://example.invalid/avatar.svg' alt='Sample User' />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Avatar"]')!;
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [{ property: 'alt', from: 'Sample User', to: 'Demo Assistant' }]);
        });
        element.querySelector('img')!.alt.should.equal('Demo Assistant');
        await act(async () => revert());
        element.querySelector('img')!.alt.should.equal('Sample User');
    });

    it('should preview and revert a circular skeleton', async () => {
        screen = await mountScreen(<Skeleton width='4rem' height='2rem' borderRadius='1px' />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Skeleton"]')!;
        let revert!: () => void;
        await act(async () => {
            revert = previewPresentationChanges(element, [{ property: 'circle', from: undefined, to: true }]);
        });
        element.style.width.should.equal('2rem');
        element.style.borderRadius.should.equal('50%');
        element.getAttribute('data-circle')!.should.equal('true');
        await act(async () => revert());
        element.style.width.should.equal('4rem');
        element.style.borderRadius.should.equal('1px');
        expect(element.getAttribute('data-circle')).to.equal(null);
    });

    it('should preserve the chip remove callback during preview', async () => {
        const onRemove = vi.fn();
        screen = await mountScreen(<Chip label='Example Project' removable onRemove={onRemove} />);
        const element = screen.container.querySelector<HTMLElement>('[data-cratis-component="Chip"]')!;
        await act(async () => { previewPresentationChanges(element, [{ property: 'label', from: 'Example Project', to: 'Demo Assistant' }]); });
        await click(element.querySelector('button')!);
        onRemove.mock.calls.length.should.equal(1);
    });
});

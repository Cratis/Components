// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef, forwardRef } from 'react';
import { expect } from 'chai';
import { vi } from 'vitest';
import { Checkbox, type CheckboxProps } from '../../Common/Checkbox';
import { Switch } from '../../Common/Switch';
import { Radio } from '../../Common/Radio';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { knownComponentDescriptors, previewPresentationChanges, registeredComponentFor } from '../../configuration/identity/componentInstances';
import { describeComponentElement } from '../describeComponentElement';
import { createTestLibrary } from '../../renderer/for_resolution/testLibrary';
import { click, hover, mountScreen, startPicking, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const AdapterChoice = forwardRef<HTMLInputElement, CheckboxProps>(function AdapterChoice(
    { label: _label, invalid, pt: _pt, onChange: _onChange, ...props }, ref,
) {
    return <input {...props} ref={ref} data-adapter='choice' data-invalid={invalid || undefined} />;
});

const library = createTestLibrary('example-choice-presentation', {
    'common.checkbox': { mode: 'presentation', fidelity: 'native', render: AdapterChoice },
    'common.switch': { mode: 'presentation', fidelity: 'native', render: AdapterChoice },
    'common.radio': { mode: 'presentation', fidelity: 'native', render: AdapterChoice },
});

const choices = [
    { component: 'Checkbox', Control: Checkbox },
    { component: 'Switch', Control: Switch },
    { component: 'Radio', Control: Radio },
];
const properties = [
    { name: 'aria-label', label: 'Accessible label', type: 'string' },
    { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
];
const inputOf = (element: HTMLElement) => (element.querySelector('input') ?? element) as HTMLInputElement;
const valuesOf = (element: HTMLElement) => describeComponentElement(element).presentationProperties.map(({ name, value, editable }) => ({ name, value, editable }));
const originalValues = [
    { name: 'aria-label', value: 'Example choice', editable: true },
    { name: 'invalid', value: false, editable: true },
];

for (const { component, Control } of choices) {
    for (const adapter of [false, true]) {
        describe(`when previewing ${component} presentation through ${adapter ? 'an adapter' : 'Core'}`, () => {
            let screen: ScreenInTheDom;
            let element: HTMLElement;
            let other: HTMLElement;
            const ref = createRef<HTMLInputElement>();
            const onChange = vi.fn();

            beforeEach(async () => {
                screen = await mountScreen(<CratisComponentsProvider library={adapter ? library : undefined}>
                    <Control ref={ref} id='example-id' name='example-group' value='example-one' checked onChange={onChange} aria-label='Example choice' invalid={false} label='Example visible label' />
                    <Control name='example-group' value='example-two' checked={false} onChange={onChange} aria-label='Example choice' invalid={false} />
                </CratisComponentsProvider>);
                [element, other] = Array.from(screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${component}"]`));
            });

            afterEach(async () => {
                screen.picker().cancel();
                await unmountScreen(screen);
            });

            it('should register only typed visual and accessible-name properties on the public wrapper', () => {
                const registration = registeredComponentFor(element)!;
                expect(registration.descriptor.properties).to.deep.equal(properties);
                expect(knownComponentDescriptors().find((descriptor) => descriptor.component === component)).to.equal(registration.descriptor);
                expect(registration.props).to.include({ name: 'example-group', value: 'example-one', checked: true, onChange });
                expect(valuesOf(element)).to.deep.equal(originalValues);
            });

            it('should own one distinct marker per root and preserve input refs, identity, and values', () => {
                expect(element.dataset.cratisComponentInstance).not.to.equal(other.dataset.cratisComponentInstance);
                expect(element.dataset.cratisComponentInstance).to.be.a('string').and.not.equal('');
                expect([element.dataset.cratisComponentId, other.dataset.cratisComponentId]).to.deep.equal(['example-id', 'example-group']);
                expect(ref.current).to.equal(inputOf(element));
                expect([ref.current!.id, ref.current!.name, ref.current!.value, ref.current!.checked]).to.deep.equal(['example-id', 'example-group', 'example-one', true]);
                expect(element.querySelectorAll('[data-cratis-component-instance]')).to.have.length(0);
            });

            it('should pick registered presentation values instead of arbitrary DOM attributes', async () => {
                inputOf(element).setAttribute('aria-label', 'DOM-only name');
                element.setAttribute('data-invalid', 'true');
                const pending = await startPicking(screen);
                await hover(element);
                await click(element);
                const picked = (await pending.result)!;
                expect(picked.component).to.equal(component);
                expect(picked.presentationProperties.map(({ name, value, editable }) => ({ name, value, editable }))).to.deep.equal(originalValues);
            });

            it('should preview and revert one instance without changing registered props or native ownership', async () => {
                const original = registeredComponentFor(element)!.props;
                let revert!: () => void;
                await act(async () => {
                    revert = previewPresentationChanges(element, [
                        { property: 'aria-label', from: 'Example choice', to: 'Preview choice' },
                        { property: 'invalid', from: false, to: true },
                    ]);
                });
                expect(inputOf(element).getAttribute('aria-label')).to.equal('Preview choice');
                expect(element.dataset.invalid).to.equal('true');
                expect([inputOf(element).name, inputOf(element).value, inputOf(element).checked]).to.deep.equal(['example-group', 'example-one', true]);
                expect(inputOf(other).getAttribute('aria-label')).to.equal('Example choice');
                expect(other.dataset.invalid).to.equal(undefined);
                expect(registeredComponentFor(element)!.props).to.deep.equal(original);
                expect(valuesOf(element)).to.deep.equal(originalValues);
                await act(async () => { revert(); revert(); });
                expect(inputOf(element).getAttribute('aria-label')).to.equal('Example choice');
                expect(element.dataset.invalid).to.equal(undefined);
            });

            it('should preserve native defaults and describe unset properties as editable', async () => {
                await act(async () => screen.root.render(<CratisComponentsProvider library={adapter ? library : undefined}>
                    <Control name='example-group' value='example-default' />
                </CratisComponentsProvider>));
                const root = screen.container.querySelector<HTMLElement>(`[data-cratis-component="${component}"]`)!;
                expect(valuesOf(root)).to.deep.equal(properties.map(({ name }) => ({ name, value: undefined, editable: true })));
                expect([inputOf(root).getAttribute('aria-label'), root.getAttribute('data-invalid'), inputOf(root).checked]).to.deep.equal([null, null, false]);
            });

            it('should unregister each instance on unmount', async () => {
                await act(async () => screen.root.render(<></>));
                expect(registeredComponentFor(element)).to.equal(undefined);
                expect(registeredComponentFor(other)).to.equal(undefined);
                expect(ref.current).to.equal(null);
            });
        });
    }
}

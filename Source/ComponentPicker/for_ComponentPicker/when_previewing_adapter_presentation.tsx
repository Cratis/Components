// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act, createRef, forwardRef } from 'react';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { NumericInput, type NumericInputProps } from '../../Common/NumericInput';
import { Surface, type SurfaceProps } from '../../Common/Surface';
import { ProgressBar, type ProgressBarProps } from '../../Display/ProgressBar';
import { previewPresentationChanges, registeredComponentFor } from '../../configuration/identity/componentInstances';
import { createTestLibrary } from '../../renderer/for_resolution/testLibrary';
import { mountScreen, unmountScreen, type ScreenInTheDom } from './given/a_screen_in_the_dom';

const AdapterProgress = ({ value, showValue, ...nativeProps }: ProgressBarProps) => (
    <div {...nativeProps} data-adapter='progress'>{showValue ? `${value}%` : undefined}</div>
);

const AdapterSurface = forwardRef<HTMLElement, SurfaceProps>(function AdapterSurface(props, ref) {
    return <article {...props} ref={ref} data-adapter='surface' />;
});

const AdapterNumericInput = forwardRef<HTMLInputElement, NumericInputProps>(function AdapterNumericInput(props, ref) {
    return <input {...props} ref={ref} type='number' data-adapter='numeric-input' />;
});

const library = createTestLibrary('example-presentation', {
    'common.progress': { mode: 'presentation', fidelity: 'native', render: AdapterProgress },
    'common.surface': { mode: 'presentation', fidelity: 'native', render: AdapterSurface },
    'common.numberInput': { mode: 'atomic', fidelity: 'native', render: AdapterNumericInput },
});

for (const component of ['ProgressBar', 'Surface', 'NumericInput']) {
    describe(`when previewing a ${component} through an adapter`, () => {
        let screen: ScreenInTheDom;
        let element: HTMLElement;
        const surfaceRef = createRef<HTMLElement>();
        const inputRef = createRef<HTMLInputElement>();

        beforeEach(async () => {
            const controls = <>
                <ProgressBar value={40} showValue aria-label='Example progress' />
                <Surface ref={surfaceRef} aria-label='Example surface'>Example content</Surface>
                <NumericInput ref={inputRef} id='example-number' value={12} placeholder='Example number' aria-label='Example quantity' />
            </>;
            screen = await mountScreen(<CratisComponentsProvider library={library}>{controls}{controls}</CratisComponentsProvider>);
            element = screen.container.querySelector<HTMLElement>(`[data-cratis-component="${component}"]`)!;
        });

        afterEach(async () => unmountScreen(screen));

        it('should forward the identity marker and register the public props once per root', () => {
            element.hasAttribute('data-adapter').should.equal(true);
            element.dataset.cratisComponentInstance!.should.not.equal('');
            new Set(Array.from(screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${component}"]`))
                .map((root) => root.dataset.cratisComponentInstance)).size.should.equal(2);
            registeredComponentFor(element)!.descriptor.component.should.equal(component);
            screen.container.querySelectorAll(`[data-cratis-component="${component}"]`).length.should.equal(2);
        });

        it('should forward previewed props and revert without changing the registration or another instance', async () => {
            const registration = registeredComponentFor(element)!;
            const original = element.getAttribute('aria-label');
            const other = screen.container.querySelectorAll<HTMLElement>(`[data-cratis-component="${component}"]`)[1];
            let revert!: () => void;
            await act(async () => {
                revert = previewPresentationChanges(element, [{ property: 'aria-label', from: original, to: 'Preview name' }]);
            });
            element.getAttribute('aria-label')!.should.equal('Preview name');
            [other.getAttribute('aria-label')].should.deep.equal([original]);
            registeredComponentFor(element)!.props.should.deep.equal(registration.props);
            await act(async () => revert());
            [element.getAttribute('aria-label')].should.deep.equal([original]);
        });

        it('should retain forwarded refs and numeric identity through the adapter', () => {
            [surfaceRef.current, inputRef.current].should.deep.equal([
                screen.container.querySelectorAll('[data-adapter="surface"]')[1],
                screen.container.querySelectorAll('[data-adapter="numeric-input"]')[1],
            ]);
            screen.container.querySelector<HTMLElement>('[data-adapter="numeric-input"]')!.dataset.cratisComponentId!
                .should.equal('example-number');
        });

        it('should unregister when the adapter is unmounted', async () => {
            await act(async () => screen.root.render(<></>));
            [registeredComponentFor(element)].should.deep.equal([undefined]);
        });
    });
}

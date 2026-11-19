// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { NumericInput, type NumericInputProps } from '../../Common/NumericInput';
import {
    definePresentationUiLibrary,
    unstable_composeUiLibraries,
    unstable_RendererScope,
    type unstable_UiLibrary,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';
import {
    aStablePresentationLibrary,
    numberInputAtomicSlots,
} from './given/a_stable_presentation_library';

const RendererScope = unstable_RendererScope;

const numberInput = <NumericInput value={3} aria-label='Quantity' />;

const renderWith = (library?: unstable_UiLibrary | readonly unstable_UiLibrary[]) =>
    renderToStaticMarkup(
        <CratisComponentsProvider library={library}>{numberInput}</CratisComponentsProvider>,
    );

const adapterMarkup = '<div data-adapter-number-input="3"></div>';

const LaterNumericInput = (_: NumericInputProps) => <div data-later-number-input />;

const laterNumericInput = () =>
    createTestLibrary('later', {
        'common.numberInput': { mode: 'atomic', fidelity: 'native', render: LaterNumericInput },
    });

const withNumericInput = () =>
    definePresentationUiLibrary(aStablePresentationLibrary(numberInputAtomicSlots()));

describe('when resolving a stable atomic number input', () => {
    it('should render the adapter number input with the public props contract', () => {
        expect(renderWith(withNumericInput())).to.equal(adapterMarkup);
    });

    it('should render the adapter number input inside a renderer scope', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <RendererScope use={withNumericInput()}>{numberInput}</RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the adapter number input when a later library overrides other slots', () => {
        const html = renderWith(
            unstable_composeUiLibraries(
                withNumericInput(),
                createTestLibrary('buttons', buttonSlot(FirstButton)),
            ),
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the built-in number input when the library has no atomic slots', () => {
        const html = renderWith(definePresentationUiLibrary(aStablePresentationLibrary()));

        expect(html).not.to.contain('data-adapter-number-input');
        expect(html).to.contain('data-cratis-part="root"');
        expect(renderWith(definePresentationUiLibrary(aStablePresentationLibrary({})))).to.equal(
            html,
        );
    });

    it('should let a later generic library override the stable number input', () => {
        const html = renderWith(unstable_composeUiLibraries(withNumericInput(), laterNumericInput()));

        expect(html).to.contain('data-later-number-input');
    });

    it('should let a later stable library override a generic number input', () => {
        const html = renderWith(unstable_composeUiLibraries(laterNumericInput(), withNumericInput()));

        expect(html).to.equal(adapterMarkup);
    });
});

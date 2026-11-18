// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { DatePickerInput, type DatePickerInputProps } from '../../Common/DatePickerInput';
import {
    definePresentationUiLibrary,
    unstable_composeUiLibraries,
    unstable_RendererScope,
    type unstable_UiLibrary,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';
import {
    aStablePresentationLibrary,
    datePickerAtomicSlots,
} from './given/a_stable_presentation_library';

const RendererScope = unstable_RendererScope;

const datePicker = (
    <DatePickerInput
        value={new Date(Date.UTC(2024, 5, 15))}
        onChange={() => undefined}
        aria-label='Delivery date'
    />
);

const renderWith = (library?: unstable_UiLibrary | readonly unstable_UiLibrary[]) =>
    renderToStaticMarkup(
        <CratisComponentsProvider library={library}>{datePicker}</CratisComponentsProvider>,
    );

const adapterMarkup = '<div data-adapter-date-picker="2024-06-15T00:00:00.000Z"></div>';

const LaterDatePicker = (_: DatePickerInputProps) => <div data-later-date-picker />;

const laterDatePicker = () =>
    createTestLibrary('later', {
        'display.datePicker': { mode: 'atomic', fidelity: 'native', render: LaterDatePicker },
    });

const withDatePicker = () =>
    definePresentationUiLibrary(aStablePresentationLibrary(datePickerAtomicSlots()));

describe('when resolving a stable atomic date picker', () => {
    it('should render the adapter date picker with the public props contract', () => {
        expect(renderWith(withDatePicker())).to.equal(adapterMarkup);
    });

    it('should render the adapter date picker inside a renderer scope', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <RendererScope use={withDatePicker()}>{datePicker}</RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the adapter date picker when a later library overrides other slots', () => {
        const html = renderWith(
            unstable_composeUiLibraries(
                withDatePicker(),
                createTestLibrary('buttons', buttonSlot(FirstButton)),
            ),
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the built-in date picker when the library has no atomic slots', () => {
        const html = renderWith(definePresentationUiLibrary(aStablePresentationLibrary()));

        expect(html).not.to.contain('data-adapter-date-picker');
        expect(html).to.contain('data-cratis-part="group"');
        expect(renderWith(definePresentationUiLibrary(aStablePresentationLibrary({})))).to.equal(
            html,
        );
    });

    it('should let a later generic library override the stable date picker', () => {
        const html = renderWith(unstable_composeUiLibraries(withDatePicker(), laterDatePicker()));

        expect(html).to.contain('data-later-date-picker');
    });

    it('should let a later stable library override a generic date picker', () => {
        const html = renderWith(unstable_composeUiLibraries(laterDatePicker(), withDatePicker()));

        expect(html).to.equal(adapterMarkup);
    });
});

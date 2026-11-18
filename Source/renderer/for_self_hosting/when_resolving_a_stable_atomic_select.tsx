// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown, type DropdownProps } from '../../Dropdown/Dropdown';
import {
    definePresentationUiLibrary,
    unstable_composeUiLibraries,
    unstable_RendererScope,
    type unstable_UiLibrary,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';
import {
    aStablePresentationLibrary,
    dropdownAtomicSlots,
} from './given/a_stable_presentation_library';

const RendererScope = unstable_RendererScope;

const dropdown = <Dropdown value='viewer' options={['viewer']} aria-label='Role' />;

const renderWith = (library?: unstable_UiLibrary | readonly unstable_UiLibrary[]) =>
    renderToStaticMarkup(
        <CratisComponentsProvider library={library}>{dropdown}</CratisComponentsProvider>,
    );

const adapterMarkup = '<div data-adapter-dropdown="viewer"></div>';

const LaterDropdown = (_: DropdownProps) => <div data-later-dropdown />;

const laterDropdown = () =>
    createTestLibrary('later', {
        'dropdown.select': { mode: 'atomic', fidelity: 'native', render: LaterDropdown },
    });

const withDropdown = () =>
    definePresentationUiLibrary(aStablePresentationLibrary(dropdownAtomicSlots()));

describe('when resolving a stable atomic dropdown', () => {
    it('should render the adapter dropdown with the public props contract', () => {
        expect(renderWith(withDropdown())).to.equal(adapterMarkup);
    });

    it('should render the adapter dropdown inside a renderer scope', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <RendererScope use={withDropdown()}>{dropdown}</RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the adapter dropdown when a later library overrides other slots', () => {
        const html = renderWith(
            unstable_composeUiLibraries(
                withDropdown(),
                createTestLibrary('buttons', buttonSlot(FirstButton)),
            ),
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the built-in dropdown when the library has no atomic slots', () => {
        const html = renderWith(definePresentationUiLibrary(aStablePresentationLibrary()));

        expect(html).not.to.contain('data-adapter-dropdown');
        expect(html).to.contain('data-cratis-part="trigger"');
        expect(renderWith(definePresentationUiLibrary(aStablePresentationLibrary({})))).to.equal(
            html,
        );
    });

    it('should let a later generic library override the stable dropdown', () => {
        const html = renderWith(unstable_composeUiLibraries(withDropdown(), laterDropdown()));

        expect(html).to.contain('data-later-dropdown');
    });

    it('should let a later stable library override a generic dropdown', () => {
        const html = renderWith(unstable_composeUiLibraries(laterDropdown(), withDropdown()));

        expect(html).to.equal(adapterMarkup);
    });
});

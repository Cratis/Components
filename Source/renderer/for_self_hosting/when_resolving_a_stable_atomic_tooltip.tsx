// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Tooltip, type TooltipProps } from '../../Common/Tooltip';
import {
    definePresentationUiLibrary,
    unstable_composeUiLibraries,
    unstable_RendererScope,
    type unstable_UiLibrary,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';
import {
    aStablePresentationLibrary,
    tooltipAtomicSlots,
} from './given/a_stable_presentation_library';

const RendererScope = unstable_RendererScope;

const tooltip = (
    <Tooltip content='Save the record'>
        <button type='button'>Save</button>
    </Tooltip>
);

const renderWith = (library?: unstable_UiLibrary | readonly unstable_UiLibrary[]) =>
    renderToStaticMarkup(
        <CratisComponentsProvider library={library}>{tooltip}</CratisComponentsProvider>,
    );

const adapterMarkup =
    '<span data-adapter-tooltip="Save the record"><button type="button">Save</button></span>';

const LaterTooltip = ({ children }: TooltipProps) => <div data-later-tooltip>{children}</div>;

const laterTooltip = () =>
    createTestLibrary('later', {
        'common.tooltip': { mode: 'atomic', fidelity: 'native', render: LaterTooltip },
    });

const withTooltip = () =>
    definePresentationUiLibrary(aStablePresentationLibrary(tooltipAtomicSlots()));

describe('when resolving a stable atomic tooltip', () => {
    it('should render the adapter tooltip with the public props contract', () => {
        expect(renderWith(withTooltip())).to.equal(adapterMarkup);
    });

    it('should render the adapter tooltip inside a renderer scope', () => {
        const html = renderToStaticMarkup(
            <CratisComponentsProvider>
                <RendererScope use={withTooltip()}>{tooltip}</RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the adapter tooltip when a later library overrides other slots', () => {
        const html = renderWith(
            unstable_composeUiLibraries(
                withTooltip(),
                createTestLibrary('buttons', buttonSlot(FirstButton)),
            ),
        );

        expect(html).to.equal(adapterMarkup);
    });

    it('should keep the built-in tooltip when the library has no atomic slots', () => {
        const html = renderWith(definePresentationUiLibrary(aStablePresentationLibrary()));

        expect(html).not.to.contain('data-adapter-tooltip');
        expect(html).to.contain('data-cratis-tooltip-trigger');
        expect(renderWith(definePresentationUiLibrary(aStablePresentationLibrary({})))).to.equal(
            html,
        );
    });

    it('should let a later generic library override the stable tooltip', () => {
        const html = renderWith(unstable_composeUiLibraries(withTooltip(), laterTooltip()));

        expect(html).to.contain('data-later-tooltip');
    });

    it('should let a later stable library override a generic tooltip', () => {
        const html = renderWith(unstable_composeUiLibraries(laterTooltip(), withTooltip()));

        expect(html).to.equal(adapterMarkup);
    });
});

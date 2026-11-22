// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    unstable_RendererContext,
    unstable_RendererRoot as RendererRoot,
    unstable_useSlot,
    type unstable_RendererContextValue,
} from '../RendererContext';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
    type unstable_SlotMap,
} from '..';
import { buttonSlot, createTestLibrary, FirstButton, LastButton } from './testLibrary';

const captureContext = (tree: (probe: React.ReactNode) => React.ReactNode) => {
    let captured: unstable_RendererContextValue | undefined;
    const Probe = () => {
        captured = useContext(unstable_RendererContext);
        return null;
    };
    renderToStaticMarkup(<>{tree(<Probe />)}</>);
    return captured!;
};

const ButtonProbe = () => {
    const button = unstable_useSlot('common.button')?.render;
    return <span data-button={button === FirstButton ? 'first' : button === LastButton ? 'last' : 'missing'} />;
};

const sampleOverlayEnvironment: unstable_CratisOverlayEnvironment = Object.freeze({
    getContainer: () => null,
});

describe('when nesting renderer roots', () => {
    it('should expose a frozen zero-config context with defaults', () => {
        const context = captureContext((probe) => <RendererRoot>{probe}</RendererRoot>);

        Object.isFrozen(context).should.equal(true);
        context.layers.length.should.equal(0);
        context.libraryMode.should.equal('strict');
        context.rendererFallback.should.equal('core');
        context.overlayEnvironment.should.equal(unstable_defaultOverlayEnvironment);
        context.providerLibraryReferences.length.should.equal(0);
        Object.keys(context.rendererSetup).length.should.equal(0);
    });

    it('should inherit the overlay environment, core slots and setup from the parent root', () => {
        const coreSlots = buttonSlot(LastButton) as unstable_SlotMap;
        const setup = { sampleAttestation: true };
        let outer: unstable_RendererContextValue | undefined;
        const OuterProbe = () => {
            outer = useContext(unstable_RendererContext);
            return null;
        };

        const inner = captureContext((probe) => (
            <RendererRoot overlayEnvironment={sampleOverlayEnvironment} coreSlots={coreSlots} rendererSetup={setup}>
                <OuterProbe />
                <RendererRoot libraryMode='degrade' rendererFallback='throw'>{probe}</RendererRoot>
            </RendererRoot>
        ));

        inner.overlayEnvironment.should.equal(sampleOverlayEnvironment);
        inner.coreSlots.should.equal(outer!.coreSlots);
        inner.rendererSetup.should.equal(outer!.rendererSetup);
        inner.libraryMode.should.equal('degrade');
        inner.rendererFallback.should.equal('throw');
    });

    it('should prefer the nested overlay environment and core slots over the parent', () => {
        const nestedEnvironment: unstable_CratisOverlayEnvironment = Object.freeze({ getContainer: () => null });

        const html = renderToStaticMarkup(
            <RendererRoot overlayEnvironment={sampleOverlayEnvironment} coreSlots={buttonSlot(FirstButton)}>
                <RendererRoot overlayEnvironment={nestedEnvironment} coreSlots={buttonSlot(LastButton)}>
                    <ButtonProbe />
                </RendererRoot>
            </RendererRoot>,
        );
        const inner = captureContext((probe) => (
            <RendererRoot overlayEnvironment={sampleOverlayEnvironment}>
                <RendererRoot overlayEnvironment={nestedEnvironment}>{probe}</RendererRoot>
            </RendererRoot>
        ));

        html.should.equal('<span data-button="last"></span>');
        inner.overlayEnvironment.should.equal(nestedEnvironment);
    });

    it('should stack the parent layers before the nested library layer', () => {
        const outerLibrary = createTestLibrary('outer-sample', buttonSlot(FirstButton));
        const innerLibrary = createTestLibrary('inner-sample', buttonSlot(LastButton));

        const context = captureContext((probe) => (
            <RendererRoot library={outerLibrary}>
                <RendererRoot libraryMode='degrade' library={innerLibrary}>{probe}</RendererRoot>
            </RendererRoot>
        ));

        context.layers.map((layer) => layer.library.id).should.deep.equal(['outer-sample', 'inner-sample']);
        context.providerLibraryReferences.should.deep.equal([innerLibrary]);
    });

    it('should accept the same library again in a nested root', () => {
        const library = createTestLibrary('repeated-sample', buttonSlot(FirstButton));

        const html = renderToStaticMarkup(
            <RendererRoot library={library}>
                <RendererRoot library={library}>
                    <ButtonProbe />
                </RendererRoot>
            </RendererRoot>,
        );

        html.should.equal('<span data-button="first"></span>');
    });

    it('should still diagnose a conflicting library below a root without a library', () => {
        const outerLibrary = createTestLibrary('outer-sample', buttonSlot(FirstButton));
        const innerLibrary = createTestLibrary('inner-sample', buttonSlot(LastButton));
        let thrown: unknown;

        try {
            renderToStaticMarkup(
                <RendererRoot library={outerLibrary}>
                    <RendererRoot>
                        <RendererRoot library={innerLibrary}>
                            <ButtonProbe />
                        </RendererRoot>
                    </RendererRoot>
                </RendererRoot>,
            );
        } catch (error: unknown) {
            thrown = error;
        }

        (thrown instanceof unstable_AdapterError).should.equal(true);
        (thrown as unstable_AdapterError).code.should.equal(unstable_adapterErrorCodes.nestedLibraries);
    });
});

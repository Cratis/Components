// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import sinon from 'sinon';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    unstable_RendererScope as RendererScope,
    unstable_useSlot,
    type unstable_SlotId,
} from '..';
import {
    buttonSlot,
    createTestLibrary,
    FirstButton,
    FirstTooltip,
    LastButton,
    LastTooltip,
    tooltipSlot,
} from './testLibrary';

const ResolutionProbe = () => {
    const button = unstable_useSlot('common.button')?.render;
    const tooltip = unstable_useSlot('common.tooltip')?.render;
    const buttonId = button === FirstButton ? 'first' : button === LastButton ? 'last' : 'missing';
    const tooltipId = tooltip === FirstTooltip ? 'first' : tooltip === LastTooltip ? 'last' : 'missing';
    return <span data-button={buttonId} data-tooltip={tooltipId} />;
};

const MissingProbe = () => {
    const declaration = unstable_useSlot('common.tooltip');
    return <span>{declaration ? 'found' : 'missing'}</span>;
};

const combinedSlots = (
    button: typeof FirstButton,
    tooltip: typeof FirstTooltip,
) => ({
    ...buttonSlot(button),
    ...tooltipSlot(tooltip),
});

describe('when resolving renderer slots', () => {
    it('should compose provider arrays with last-library-wins slots', () => {
        const first = createTestLibrary('first', buttonSlot(FirstButton));
        const last = createTestLibrary('last', buttonSlot(LastButton));

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={[first, last]}>
                <ResolutionProbe />
            </CratisComponentsProvider>,
        );

        html.should.contain('data-button="last"');
    });

    it('should use the nearest scope only for its allowed slots', () => {
        const outer = createTestLibrary(
            'outer',
            combinedSlots(FirstButton, FirstTooltip),
        );
        const inner = createTestLibrary(
            'inner',
            combinedSlots(LastButton, LastTooltip),
        );

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={outer}>
                <RendererScope use={inner} only={['common.button']}>
                    <ResolutionProbe />
                </RendererScope>
            </CratisComponentsProvider>,
        );

        html.should.contain('data-button="last"');
        html.should.contain('data-tooltip="first"');
    });

    it('should reject unknown runtime scope slots', () => {
        const outer = createTestLibrary('outer', buttonSlot(FirstButton));
        const inner = createTestLibrary('inner', buttonSlot(LastButton));
        const invalidOnly = ['unknown.slot'] as unknown as readonly unstable_SlotId[];
        let error: unknown;

        try {
            renderToStaticMarkup(
                <CratisComponentsProvider library={outer}>
                    <RendererScope use={inner} only={invalidOnly}>
                        <span />
                    </RendererScope>
                </CratisComponentsProvider>,
            );
        } catch (caught: unknown) {
            error = caught;
        }

        error.should.be.instanceOf(unstable_AdapterError);
        (error as unstable_AdapterError).code.should.equal(
            unstable_adapterErrorCodes.missingRequirement,
        );
    });

    it('should use the empty Core fallback deterministically and log once per provider', () => {
        const consoleError = sinon.stub(console, 'error');
        const DuplicateFallbackProbe = () => {
            unstable_useSlot('common.tooltip');
            unstable_useSlot('common.tooltip');
            return <span>missing</span>;
        };

        try {
            const html = renderToStaticMarkup(
                <CratisComponentsProvider>
                    <DuplicateFallbackProbe />
                </CratisComponentsProvider>,
            );

            html.should.equal('<span>missing</span>');
            consoleError.callCount.should.equal(1);
            String(consoleError.firstCall.firstArg).should.contain(
                unstable_adapterErrorCodes.strictProfileFallback,
            );
        } finally {
            consoleError.restore();
        }
    });

    it('should allow fallback outside a declared profile promise', () => {
        const library = createTestLibrary('button-only', buttonSlot(FirstButton), {
            profileSlots: ['common.button'],
        });
        const consoleError = sinon.stub(console, 'error');

        try {
            const html = renderToStaticMarkup(
                <CratisComponentsProvider library={library}>
                    <MissingProbe />
                </CratisComponentsProvider>,
            );

            html.should.equal('<span>missing</span>');
            consoleError.callCount.should.equal(1);
        } finally {
            consoleError.restore();
        }
    });

    it('should throw CRATIS-UI-1003 at a throw fallback terminal', () => {
        const consoleError = sinon.stub(console, 'error');
        let error: unknown;

        try {
            renderToStaticMarkup(
                <CratisComponentsProvider rendererFallback='throw'>
                    <MissingProbe />
                </CratisComponentsProvider>,
            );
        } catch (caught: unknown) {
            error = caught;
        } finally {
            consoleError.restore();
        }

        error.should.be.instanceOf(unstable_AdapterError);
        (error as unstable_AdapterError).code.should.equal(
            unstable_adapterErrorCodes.strictProfileFallback,
        );
    });
});

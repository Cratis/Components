// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import sinon from 'sinon';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { unstable_RendererRoot, unstable_useSlot } from '../RendererContext';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    unstable_RendererScope as RendererScope,
    type unstable_SlotDeclaration,
    type unstable_SlotId,
    type unstable_SlotMap,
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

const RendererRoot = unstable_RendererRoot;

const ResolutionProbe = () => {
    const button = unstable_useSlot('common.button')?.render;
    const tooltip = unstable_useSlot('common.tooltip')?.render;
    const buttonId =
        button === FirstButton ? 'first' : button === LastButton ? 'last' : 'missing';
    const tooltipId =
        tooltip === FirstTooltip ? 'first' : tooltip === LastTooltip ? 'last' : 'missing';
    return <span data-button={buttonId} data-tooltip={tooltipId} />;
};

const MissingProbe = () => {
    const declaration = unstable_useSlot('common.tooltip');
    return <span>{declaration ? 'found' : 'missing'}</span>;
};

const combinedSlots = (button: typeof FirstButton, tooltip: typeof FirstTooltip) => ({
    ...buttonSlot(button),
    ...tooltipSlot(tooltip),
});

const localButtonDeclaration = Object.freeze({
    mode: 'presentation',
    fidelity: 'native',
    render: FirstButton,
}) satisfies unstable_SlotDeclaration<'common.button'>;

const LocalCoreProbe = () => {
    const Render = unstable_useSlot('common.button', localButtonDeclaration).render;
    return <Render />;
};

describe('when resolving renderer slots', () => {
    it('should compose provider arrays with last-library-wins slots', () => {
        const first = createTestLibrary('first', buttonSlot(FirstButton));
        const last = createTestLibrary('last', buttonSlot(LastButton));

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={[first, last]}>
                <ResolutionProbe />
            </CratisComponentsProvider>,
        );

        expect(html).to.contain('data-button="last"');
    });

    it('should resolve external slots before facade-local and context Core declarations', () => {
        const external = createTestLibrary('external', buttonSlot(LastButton));
        const coreSlots = buttonSlot(LastButton);

        const html = renderToStaticMarkup(
            <RendererRoot library={external} coreSlots={coreSlots}>
                <LocalCoreProbe />
            </RendererRoot>,
        );

        expect(html).to.equal('<span>last-button</span>');
    });

    it('should resolve a facade-local Core declaration before the optional context table', () => {
        const coreSlots = buttonSlot(LastButton) as unstable_SlotMap;

        const html = renderToStaticMarkup(
            <RendererRoot coreSlots={coreSlots}>
                <LocalCoreProbe />
            </RendererRoot>,
        );

        expect(html).to.equal('<span>first-button</span>');
    });

    it('should use the nearest scope only for its allowed slots', () => {
        const outer = createTestLibrary(
            'outer',
            combinedSlots(FirstButton, FirstTooltip),
        );
        const inner = createTestLibrary('inner', combinedSlots(LastButton, LastTooltip));

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={outer}>
                <RendererScope use={inner} only={['common.button']}>
                    <ResolutionProbe />
                </RendererScope>
            </CratisComponentsProvider>,
        );

        expect(html).to.contain('data-button="last"');
        expect(html).to.contain('data-tooltip="first"');
    });

    it('should reject unknown runtime scope slots', () => {
        const outer = createTestLibrary('outer', buttonSlot(FirstButton));
        const inner = createTestLibrary('inner', buttonSlot(LastButton));
        // SAFETY: The fixture intentionally bypasses the public slot union to exercise runtime validation.
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

        expect(error).to.be.instanceOf(unstable_AdapterError);
        expect((error as unstable_AdapterError).code).to.equal(
            unstable_adapterErrorCodes.missingRequirement,
        );
    });

    it('should use the empty Core fallback deterministically without logging during SSR render', () => {
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

            expect(html).to.equal('<span>missing</span>');
            expect(consoleError.callCount).to.equal(0);
        } finally {
            consoleError.restore();
        }
    });

    it('should allow fallback outside a declared profile promise without render side effects', () => {
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

            expect(html).to.equal('<span>missing</span>');
            expect(consoleError.callCount).to.equal(0);
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

        expect(error).to.be.instanceOf(unstable_AdapterError);
        expect((error as unstable_AdapterError).code).to.equal(
            unstable_adapterErrorCodes.strictProfileFallback,
        );
    });
});

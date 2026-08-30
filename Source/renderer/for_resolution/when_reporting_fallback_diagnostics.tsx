// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import sinon, { type SinonStub } from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { unstable_adapterErrorCodes } from '..';
import { unstable_useSlot } from '../RendererContext';
import { buttonSlot, createTestLibrary, FirstButton } from './testLibrary';

const DuplicateFallbackProbe = () => {
    unstable_useSlot('common.tooltip');
    unstable_useSlot('common.tooltip');
    return <span>missing</span>;
};

describe('when reporting renderer fallback diagnostics', () => {
    let container: HTMLDivElement;
    let root: Root;
    let consoleError: SinonStub;

    beforeEach(() => {
        // SAFETY: React's test-only act flag is intentionally absent from the DOM global type.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        consoleError = sinon.stub(console, 'error');
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        consoleError.restore();
    });

    it('should report one actionable diagnostic after an adapter falls back, never during render', async () => {
        const library = createTestLibrary('button-only', buttonSlot(FirstButton), {
            profileSlots: ['common.button'],
        });

        await act(async () => {
            root.render(
                <CratisComponentsProvider library={library}>
                    <DuplicateFallbackProbe />
                </CratisComponentsProvider>,
            );
        });

        expect(container.textContent).to.equal('missing');
        expect(consoleError.callCount).to.equal(1);
        expect(String(consoleError.firstCall.firstArg)).to.contain(
            unstable_adapterErrorCodes.strictProfileFallback,
        );

        await act(async () => {
            root.render(
                <CratisComponentsProvider library={library}>
                    <DuplicateFallbackProbe />
                </CratisComponentsProvider>,
            );
        });

        expect(consoleError.callCount).to.equal(1);
    });

    it('should treat the zero-config Core path as the default rather than a fallback warning', async () => {
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <DuplicateFallbackProbe />
                </CratisComponentsProvider>,
            );
        });

        expect(container.textContent).to.equal('missing');
        expect(consoleError.callCount).to.equal(0);
    });
});

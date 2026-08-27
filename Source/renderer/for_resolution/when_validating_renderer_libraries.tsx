// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import sinon from 'sinon';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_UiLibrary,
} from '..';
import {
    buttonSlot,
    createTestLibrary,
    FirstButton,
} from './testLibrary';

const captureRendererError = (render: () => unknown): unstable_AdapterError => {
    try {
        render();
    } catch (error: unknown) {
        if (error instanceof unstable_AdapterError) return error;
        throw error;
    }
    throw new Error('Expected renderer setup to fail.');
};

const renderLibraryError = (library: unstable_UiLibrary): unstable_AdapterError =>
    captureRendererError(() => renderToStaticMarkup(
        <CratisComponentsProvider library={library}>
            <span />
        </CratisComponentsProvider>,
    ));

describe('when validating renderer libraries', () => {
    it('should reject an ABI mismatch with CRATIS-UI-1001', () => {
        const library = createTestLibrary('wrong-abi', buttonSlot(FirstButton), {
            abi: 2,
        });

        const error = renderLibraryError(library);

        error.code.should.equal(unstable_adapterErrorCodes.abiMismatch);
        error.diagnostic.adapterId.should.equal('wrong-abi');
    });

    it('should reject a missing promised profile slot with CRATIS-UI-1002', () => {
        const library = createTestLibrary('profile-gap', {}, {
            profileSlots: ['common.button'],
        });

        const error = renderLibraryError(library);

        error.code.should.equal(unstable_adapterErrorCodes.missingRequirement);
        error.diagnostic.slotId.should.equal('common.button');
    });

    it('should reject an unsupported promised profile slot', () => {
        const library = createTestLibrary('unsupported-slot', {
            'common.button': {
                mode: 'presentation',
                fidelity: 'unsupported',
                render: FirstButton,
            },
        });

        const error = renderLibraryError(library);

        error.code.should.equal(unstable_adapterErrorCodes.missingRequirement);
        error.diagnostic.slotId!.should.equal('common.button');
    });

    it('should reject a promised profile without its required render capability', () => {
        const library = createTestLibrary('capability-gap', buttonSlot(FirstButton), {
            capabilities: [],
        });

        const error = renderLibraryError(library);

        error.code.should.equal(unstable_adapterErrorCodes.missingRequirement);
        error.message.should.contain('slot.render');
    });

    it('should preserve a supplied preflight diagnostic code', () => {
        const library = createTestLibrary('licensed', buttonSlot(FirstButton), {
            preflight: () => [{
                code: unstable_adapterErrorCodes.missingLicenseKey,
                adapterId: 'licensed',
                message: 'A license key is required.',
                remedy: 'Configure the adapter license key.',
            }],
        });

        const error = renderLibraryError(library);

        error.code.should.equal(unstable_adapterErrorCodes.missingLicenseKey);
    });

    it('should run preflight once and log its diagnostic once per provider identity in degrade mode', async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        let preflightRuns = 0;
        const library = createTestLibrary('degraded', buttonSlot(FirstButton), {
            preflight: () => {
                preflightRuns += 1;
                return [{
                    code: unstable_adapterErrorCodes.missingUpstreamPeer,
                    adapterId: 'degraded',
                    message: 'The renderer peer is missing.',
                    remedy: 'Install the renderer peer.',
                }];
            },
        });
        const consoleError = sinon.stub(console, 'error');
        const container = document.createElement('div');
        const root = createRoot(container);
        const content = (
            <CratisComponentsProvider library={library} libraryMode='degrade'>
                <span>content</span>
            </CratisComponentsProvider>
        );

        try {
            await act(async () => root.render(content));
            await act(async () => root.render(content));

            preflightRuns.should.equal(1);
            consoleError.callCount.should.equal(1);
            String(consoleError.firstCall.firstArg).should.contain(
                unstable_adapterErrorCodes.missingUpstreamPeer,
            );
        } finally {
            await act(async () => root.unmount());
            consoleError.restore();
        }
    });

    it('should diagnose conflicting nested provider libraries with CRATIS-UI-1006', () => {
        const outer = createTestLibrary('outer', buttonSlot(FirstButton));
        const inner = createTestLibrary('inner', buttonSlot(FirstButton));

        const error = captureRendererError(() => renderToStaticMarkup(
            <CratisComponentsProvider library={outer}>
                <CratisComponentsProvider library={inner}>
                    <span />
                </CratisComponentsProvider>
            </CratisComponentsProvider>,
        ));

        error.code.should.equal(unstable_adapterErrorCodes.nestedLibraries);
        error.diagnostic.adapterId.should.equal('inner');
    });
});

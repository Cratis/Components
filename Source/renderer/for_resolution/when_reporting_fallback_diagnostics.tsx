// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type {} from 'chai/register-should';
import sinon, { type SinonStub } from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    unstable_adapterErrorCodes,
    unstable_RendererScope as RendererScope,
} from '..';
import { unstable_RendererRoot as RendererRoot, unstable_useSlot } from '../RendererContext';
import { buttonSlot, createTestLibrary, FirstButton, FirstTooltip, LastTooltip, tooltipSlot } from './testLibrary';

const localTooltip = { mode: 'atomic', fidelity: 'native', render: FirstTooltip } as const;
const LocalFallbackProbe = () => {
    const Render = unstable_useSlot('common.tooltip', localTooltip).render;
    return <Render><span>Example trigger</span></Render>;
};
const ContextFallbackProbe = () => {
    const Render = unstable_useSlot('common.tooltip')?.render;
    return Render ? <Render><span>Example trigger</span></Render> : <span>missing</span>;
};
const presentation = { mode: 'presentation', fidelity: 'native', render: () => <span>Example presentation</span> } as const;
const stableLibrary = definePresentationUiLibrary({
    id: 'example-presentation',
    displayName: 'Example presentation',
    abi: 1,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
    slots: {
        'common.button': presentation,
        'common.iconButton': presentation,
        'common.textInput': presentation,
        'common.textArea': presentation,
        'common.checkbox': presentation,
        'common.radio': presentation,
        'common.switch': presentation,
        'common.progress': presentation,
        'common.surface': presentation,
    },
});

describe('when reporting renderer fallback diagnostics', () => {
    let container: HTMLDivElement;
    let root: Root;
    let consoleError: SinonStub;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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

    const render = async (content: ReactNode) => { await act(async () => root.render(content)); };

    it('should render duplicate local Core fallbacks quietly on mount and rerender', async () => {
        const library = createTestLibrary('button-only', buttonSlot(FirstButton), { profileSlots: ['common.button'] });
        const content = () => <RendererRoot library={library}><LocalFallbackProbe /><LocalFallbackProbe /></RendererRoot>;
        await render(content());
        await render(content());
        container.textContent!.should.equal('first-tooltipfirst-tooltip');
        consoleError.callCount.should.equal(0);
    });

    it('should render context Core fallback quietly for a valid nine-slot presentation adapter', async () => {
        await render(
            <RendererRoot library={stableLibrary} coreSlots={tooltipSlot(LastTooltip)}>
                <ContextFallbackProbe />
            </RendererRoot>,
        );
        container.textContent!.should.equal('last-tooltip');
        consoleError.callCount.should.equal(0);
    });

    it('should keep allowed fallback quiet when a scope filters a supported slot out', async () => {
        const scoped = createTestLibrary('scoped', { ...buttonSlot(FirstButton), ...tooltipSlot(LastTooltip) });
        await render(
            <RendererRoot>
                <RendererScope use={scoped} only={['common.button']}>
                    <LocalFallbackProbe />
                </RendererScope>
            </RendererRoot>,
        );
        container.textContent!.should.equal('first-tooltip');
        consoleError.callCount.should.equal(0);
    });

    it('should keep zero-config Core rendering quiet', async () => {
        await render(<RendererRoot><LocalFallbackProbe /></RendererRoot>);
        container.textContent!.should.equal('first-tooltip');
        consoleError.callCount.should.equal(0);
    });

    for (const unsupported of [false, true]) {
        for (const scoped of [false, true]) {
            it(`should still report an ${unsupported ? 'unsupported' : 'absent'} promised slot in a degrading ${scoped ? 'scope' : 'provider'}`, async () => {
                const library = createTestLibrary('broken-promise', unsupported ? { 'common.tooltip': { ...localTooltip, fidelity: 'unsupported' } } : {}, {
                    profileSlots: ['common.tooltip'],
                });
                const content = () => scoped ? (
                    <RendererRoot libraryMode='degrade'>
                        <RendererScope use={library}><LocalFallbackProbe /></RendererScope>
                    </RendererRoot>
                ) : (
                    <RendererRoot library={library} libraryMode='degrade'><LocalFallbackProbe /></RendererRoot>
                );
                await render(content());
                await render(content());
                container.textContent!.should.equal('first-tooltip');
                consoleError.callCount.should.equal(1);
                String(consoleError.firstCall.firstArg).should.contain(unstable_adapterErrorCodes.missingRequirement);
                String(consoleError.firstCall.firstArg).should.contain('common.tooltip');
            });
        }
    }
});

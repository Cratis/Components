// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { Tooltip } from '../Tooltip';

describe('when the tooltip trigger receives focus', () => {
    let container: HTMLDivElement;
    let root: Root;
    let button: HTMLButtonElement;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <Tooltip content='Save changes'>
                        <button type='button'>Save</button>
                    </Tooltip>
                </CratisComponentsProvider>,
            );
        });
        const renderedButton = container.querySelector<HTMLButtonElement>('button');
        if (!renderedButton) throw new Error('Tooltip did not render its trigger.');
        button = renderedButton;
        await act(async () => button.focus());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should describe the actual focusable control', () => {
        const descriptionId = button.getAttribute('aria-describedby');
        expect(descriptionId).not.to.equal(null);
        expect(document.getElementById(descriptionId ?? '')?.textContent).to.equal(
            'Save changes',
        );
    });

    it('should expose only the actual control as the trigger tab stop', () => {
        const triggers = container.querySelectorAll('[data-cratis-part="trigger"]');
        expect(triggers).to.have.lengthOf(1);
        expect(triggers[0]).to.equal(button);
        expect(button.tabIndex).to.equal(0);
    });

    it('should expose open only on the popup that knows it is mounted', () => {
        const popup = document.querySelector('[data-cratis-part="popup"]');

        expect(popup?.getAttribute('data-open')).to.equal('true');
        expect(button.hasAttribute('data-open')).to.equal(false);
        expect(document.querySelector('[data-open="false"]')).to.equal(null);
    });
});

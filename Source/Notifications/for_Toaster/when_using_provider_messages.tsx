// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { toast } from '../toast';
import { Toaster } from '../Toaster';

/**
 * Precedence coverage for the `notifications` provider message group: a named component prop
 * (`dismissAriaLabel`, `regionAriaLabel`) wins, then the provider message, then the English
 * fallback.
 */
describe('when the Toaster uses provider messages', () => {
    let container: HTMLDivElement;
    let root: Root;

    const render = async (element: React.ReactElement) => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        toast.dismiss();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(element);
        });
        await act(async () => {
            toast({ title: 'Hello' });
        });
    };

    afterEach(async () => {
        await act(async () => {
            toast.dismiss();
            root.unmount();
        });
        container.remove();
    });

    it('should use the English fallback with no provider and no prop override', async () => {
        await render(
            <CratisComponentsProvider>
                <Toaster timeout={60_000} />
            </CratisComponentsProvider>,
        );
        expect(document.querySelector('[data-cratis-part="region"]')?.getAttribute(
            'aria-label',
        )).to.equal('Notifications');
        expect(document.querySelector('[data-cratis-part="close"]')?.getAttribute(
            'aria-label',
        )).to.equal('Dismiss');
    });

    it('should use the provider message when no prop override is given', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        notifications: {
                            dismiss: 'Provider Dismiss',
                            region: 'Provider Region',
                        },
                    },
                }}
            >
                <Toaster timeout={60_000} />
            </CratisComponentsProvider>,
        );
        expect(document.querySelector('[data-cratis-part="region"]')?.getAttribute(
            'aria-label',
        )).to.equal('Provider Region');
        expect(document.querySelector('[data-cratis-part="close"]')?.getAttribute(
            'aria-label',
        )).to.equal('Provider Dismiss');
    });

    it('should prefer a named prop override over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        notifications: {
                            dismiss: 'Provider Dismiss',
                            region: 'Provider Region',
                        },
                    },
                }}
            >
                <Toaster
                    timeout={60_000}
                    dismissAriaLabel='Explicit Dismiss'
                    regionAriaLabel='Explicit Region'
                />
            </CratisComponentsProvider>,
        );
        expect(document.querySelector('[data-cratis-part="region"]')?.getAttribute(
            'aria-label',
        )).to.equal('Explicit Region');
        expect(document.querySelector('[data-cratis-part="close"]')?.getAttribute(
            'aria-label',
        )).to.equal('Explicit Dismiss');
    });
});

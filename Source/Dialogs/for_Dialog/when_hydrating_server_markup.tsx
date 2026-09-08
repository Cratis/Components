// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog } from '../Dialog';

describe('when hydrating server markup', () => {
    let container: HTMLDivElement;
    let root: Root;
    const hydrationErrors: string[] = [];
    const originalConsoleError = console.error;

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
        vi.spyOn(console, 'error').mockImplementation((...values: unknown[]) => {
            const message = values.map(String).join(' ');
            if (/hydration|did not match|server rendered/i.test(message)) {
                hydrationErrors.push(message);
            } else {
                originalConsoleError(...values);
            }
        });

        const element = (
            <CratisComponentsProvider>
                <Dialog title='Hydrated dialog'>Content</Dialog>
            </CratisComponentsProvider>
        );
        container = document.createElement('div');
        const serverDocument = new DOMParser().parseFromString(
            renderToString(element),
            'text/html',
        );
        container.append(...Array.from(serverDocument.body.childNodes));
        document.body.append(container);

        await act(async () => {
            root = hydrateRoot(container, element);
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.restoreAllMocks();
        hydrationErrors.length = 0;
    });

    it('should preserve the server tree through the first client render', () => {
        expect(hydrationErrors).to.deep.equal([]);
        expect(document.querySelector('[data-cratis-part="root"]')).not.to.equal(null);
    });
});

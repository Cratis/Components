// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dropdown } from '../Dropdown';

/**
 * Precedence coverage for the `dropdown` provider message group across the show-options and
 * clear-selection labels: a named component prop wins, then the provider message, then the
 * English fallback. Six render sites resolve through the same two variables in `Dropdown` —
 * this spec exercises the filterable-multiple, filterable-single, and plain-select paths, each
 * with and without a per-instance override.
 */
describe('when the Dropdown uses provider messages', () => {
    let container: HTMLDivElement;
    let root: Root;

    const options = [{ label: 'Frontend', value: 'frontend' }];

    const render = async (element: React.ReactElement) => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => {
            root.render(element);
        });
    };

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should use the English fallback with no provider and no prop override (plain select)', async () => {
        await render(
            <CratisComponentsProvider>
                <Dropdown value='frontend' options={options} showClear />
            </CratisComponentsProvider>,
        );
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(clear?.getAttribute('aria-label')).to.equal('Clear selection');
    });

    it('should use the provider message when no prop override is given (plain select)', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dropdown: { clearSelection: 'Fjern valg' } } }}
            >
                <Dropdown value='frontend' options={options} showClear />
            </CratisComponentsProvider>,
        );
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(clear?.getAttribute('aria-label')).to.equal('Fjern valg');
    });

    it('should prefer a per-instance pt override over the provider message (plain select)', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dropdown: { clearSelection: 'Fjern valg' } } }}
            >
                <Dropdown
                    value='frontend'
                    options={options}
                    showClear
                    pt={{ clear: { 'aria-label': 'Explicit clear' } }}
                />
            </CratisComponentsProvider>,
        );
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(clear?.getAttribute('aria-label')).to.equal('Explicit clear');
    });

    it('should resolve the show-options trigger label through the same precedence (filterable single-select)', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dropdown: { showOptions: 'Vis alternativer' } } }}
            >
                <Dropdown value='frontend' options={options} filter />
            </CratisComponentsProvider>,
        );
        const trigger = container.querySelector('[data-cratis-part="trigger"]');
        expect(trigger?.getAttribute('aria-label')).to.equal('Vis alternativer');
    });

    it('should resolve the show-options and clear-selection labels for the filterable multiple-select path', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    messages: {
                        dropdown: {
                            showOptions: 'Vis alternativer',
                            clearSelection: 'Fjern valg',
                        },
                    },
                }}
            >
                <Dropdown value={['frontend']} options={options} filter multiple showClear />
            </CratisComponentsProvider>,
        );
        const trigger = container.querySelector('[data-cratis-part="trigger"]');
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(trigger?.getAttribute('aria-label')).to.equal('Vis alternativer');
        expect(clear?.getAttribute('aria-label')).to.equal('Fjern valg');
    });

    it('should resolve the clear-selection label for the native multiple-select path', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { dropdown: { clearSelection: 'Fjern valg' } } }}
            >
                <Dropdown value={['frontend']} options={options} multiple showClear />
            </CratisComponentsProvider>,
        );
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(clear?.getAttribute('aria-label')).to.equal('Fjern valg');
    });
});

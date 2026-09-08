// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

/**
 * Precedence coverage for the orphaned `'Date'` fallback: when neither an explicit `aria-label`
 * nor a `placeholder` is supplied, the segmented input's accessible name now resolves through
 * the provider's `datePicker.label` message before falling back to the English `'Date'`
 * literal it always had.
 */
describe('when no accessible name or placeholder is given', () => {
    let container: HTMLDivElement;
    let root: Root;

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

    const group = () => container.querySelector<HTMLElement>('[data-cratis-part="group"]');

    it("should fall back to the English 'Date' literal with no provider message", async () => {
        await render(
            <CratisComponentsProvider>
                <DatePickerInput value={null} onChange={() => undefined} />
            </CratisComponentsProvider>,
        );
        expect(group()?.getAttribute('aria-label')).to.equal('Date');
    });

    it('should use the provider message when no aria-label or placeholder is given', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { datePicker: { label: 'Provider Date Label' } } }}
            >
                <DatePickerInput value={null} onChange={() => undefined} />
            </CratisComponentsProvider>,
        );
        expect(group()?.getAttribute('aria-label')).to.equal('Provider Date Label');
    });

    it('should prefer an explicit aria-label over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { datePicker: { label: 'Provider Date Label' } } }}
            >
                <DatePickerInput
                    value={null}
                    onChange={() => undefined}
                    aria-label='Explicit label'
                />
            </CratisComponentsProvider>,
        );
        expect(group()?.getAttribute('aria-label')).to.equal('Explicit label');
    });

    it('should prefer a placeholder over the provider message', async () => {
        await render(
            <CratisComponentsProvider
                value={{ messages: { datePicker: { label: 'Provider Date Label' } } }}
            >
                <DatePickerInput
                    value={null}
                    onChange={() => undefined}
                    placeholder='Choose a date'
                />
            </CratisComponentsProvider>,
        );
        expect(group()?.getAttribute('aria-label')).to.equal('Choose a date');
    });
});

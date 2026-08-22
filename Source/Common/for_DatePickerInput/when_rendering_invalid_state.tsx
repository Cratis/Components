// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

[true, false].forEach((invalid) => {
    describe(`when rendering with invalid set to ${invalid}`, () => {
        let container: HTMLDivElement;
        let root: Root;
        let input: HTMLInputElement;
        let errorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(async () => {
            // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
            (
                globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
            ).IS_REACT_ACT_ENVIRONMENT = true;
            errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            container = document.createElement('div');
            document.body.append(container);
            root = createRoot(container);

            await act(async () => {
                root.render(
                    <CratisComponentsProvider>
                        <DatePickerInput
                            value={null}
                            onChange={() => undefined}
                            invalid={invalid}
                        />
                    </CratisComponentsProvider>,
                );
            });

            const renderedInput = container.querySelector<HTMLInputElement>(
                '[data-scope="datepicker"][data-part="input"]',
            );
            if (!renderedInput) {
                throw new Error('DatePickerInput did not render its input element.');
            }
            input = renderedInput;
        });

        afterEach(async () => {
            await act(async () => root.unmount());
            container.remove();
            errorSpy.mockRestore();
        });

        it('should not report a rejected DOM attribute', () => {
            expect(errorSpy.mock.calls).to.deep.equal([]);
        });

        it('should represent the invalid state through accepted input attributes', () => {
            expect(input.getAttribute('aria-invalid')).to.equal(invalid ? 'true' : null);
            expect(input.hasAttribute('data-invalid')).to.equal(invalid);
        });
    });
});

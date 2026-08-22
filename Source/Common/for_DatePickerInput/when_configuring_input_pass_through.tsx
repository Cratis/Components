// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';

describe('when configuring input pass-through', () => {
    let container: HTMLDivElement;
    let root: Root;
    let input: HTMLInputElement;

    beforeEach(async () => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider>
                    <DatePickerInput
                        value={null}
                        onChange={() => undefined}
                        pt={{
                            input: {
                                id: 'appointment-date',
                                'aria-label': 'Appointment date',
                                'aria-describedby': 'appointment-date-help',
                                disabled: true,
                            },
                        }}
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
    });

    it('should set the input id', () => {
        expect(input.id).to.equal('appointment-date');
    });

    it('should set the accessible name', () => {
        expect(input.getAttribute('aria-label')).to.equal('Appointment date');
    });

    it('should set the description reference', () => {
        expect(input.getAttribute('aria-describedby')).to.equal('appointment-date-help');
    });

    it('should disable the input', () => {
        expect(input.disabled).to.equal(true);
    });
});

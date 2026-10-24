// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { waitFor } from 'storybook/test';
import { DatePickerInput } from './DatePickerInput';
import { CratisComponentsProvider } from './CratisComponentsProvider';
import '../tokens.css';
import '../theme.css';
import './DatePickerInput.css';

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(() => {
    root.unmount();
    host.remove();
});

describe('date picker popover modality', () => {
    for (const isNonModal of [undefined, true, false]) {
        it(`should ${isNonModal ? 'deliver' : 'consume'} the first outside click with isNonModal=${isNonModal}`, async () => {
            let submissions = 0;
            root.render(
                <CratisComponentsProvider>
                    <DatePickerInput
                        value={null}
                        onChange={() => undefined}
                        isNonModal={isNonModal}
                    />
                    <button
                        type='button'
                        style={{ marginTop: '500px' }}
                        onClick={() => submissions++}
                    >
                        Submit
                    </button>
                </CratisComponentsProvider>,
            );
            await page.getByRole('button', { name: /open calendar/i }).click();
            await expect.element(page.getByRole('dialog')).toBeVisible();
            // Force permits an actual pointer click on an aria-hidden target under the modal underlay.
            await page
                .getByRole('button', { name: 'Submit', includeHidden: true })
                .click({ force: true });
            await waitFor(() =>
                expect(document.querySelector('[data-cratis-part="popover"]')).toBeNull(),
            );
            expect(submissions).toBe(isNonModal ? 1 : 0);
        });
    }

    it('should close with Escape and return focus to the trigger when non-modal', async () => {
        root.render(
            <CratisComponentsProvider>
                <DatePickerInput value={null} onChange={() => undefined} isNonModal />
            </CratisComponentsProvider>,
        );
        const trigger = page.getByRole('button', { name: /open calendar/i });
        await trigger.click();
        await expect.element(page.getByRole('dialog')).toBeVisible();
        await userEvent.keyboard('{Escape}');
        await expect.element(trigger).toHaveFocus();
        expect(document.querySelector('[data-cratis-part="popover"]')).toBeNull();
    });
});

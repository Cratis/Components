// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { waitFor } from 'storybook/test';
import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { CommandForm } from '@cratis/arc.react/commands';
import { CalendarField } from './fields/CalendarField';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import '../tokens.css';
import '../theme.css';
import '../Common/DatePickerInput.css';

class ScheduleCommand extends Command {
    readonly route: string = '/api/schedule';
    readonly propertyDescriptors = [new PropertyDescriptor('startDate', Date)];
    startDate: Date | null = null;
    get requestParameters(): string[] {
        return [];
    }
    constructor() {
        super(Object, false);
    }
}

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

describe('calendar field popover modality', () => {
    for (const isNonModal of [undefined, true]) {
        it(`should ${isNonModal ? 'deliver' : 'consume'} the first submit click with isNonModal=${isNonModal}`, async () => {
            let submissions = 0;
            root.render(
                <CratisComponentsProvider>
                    <CommandForm<ScheduleCommand> command={ScheduleCommand}>
                        <CalendarField<ScheduleCommand>
                            value={(c) => c.startDate}
                            title='Start date'
                            isNonModal={isNonModal}
                        />
                    </CommandForm>
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
            await page.getByRole('button', { name: /15/ }).first().click();
            // Picking a date closes the popover; reopen it so it is open when Submit is clicked.
            await waitFor(() =>
                expect(document.querySelector('[data-cratis-part="popover"]')).toBeNull(),
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
});

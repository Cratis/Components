// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import {
    CratisComponentsProvider,
    useCratisComponentsConfig,
} from '../CratisComponentsProvider';

/**
 * The deprecated `locales` merge used to reconstruct `messages.datePicker` from a fixed
 * list of keys (`today`, `clear`, `openCalendar`, `previousMonth`, `nextMonth`), silently
 * dropping every owned message not on that list — including the accessible `label` message
 * — whenever a legacy locale entry was present. That drop fell back to the English `'Date'`
 * literal regardless of the configured locale. These specs pin every owned `datePicker`
 * message to survive the legacy merge.
 */
describe('when legacy locale messages are present', () => {
    let container: HTMLDivElement;
    let root: Root;
    let resolvedDatePicker: Record<string, string | undefined> | undefined;

    const ConfigProbe = () => {
        const config = useCratisComponentsConfig();
        resolvedDatePicker = config.messages?.datePicker;
        return null;
    };

    const render = async (element: React.ReactElement) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
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

    it('should preserve the datePicker label message through a legacy-locale merge', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    locale: 'nb-NO',
                    locales: { 'nb-NO': { today: 'I dag', clear: 'Tøm' } },
                    messages: { datePicker: { label: 'Provider Date Label' } },
                }}
            >
                <ConfigProbe />
            </CratisComponentsProvider>,
        );
        expect(resolvedDatePicker?.label).to.equal('Provider Date Label');
    });

    it('should still resolve the legacy today/clear labels alongside the preserved label', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    locale: 'nb-NO',
                    locales: { 'nb-NO': { today: 'I dag', clear: 'Tøm' } },
                    messages: { datePicker: { label: 'Provider Date Label' } },
                }}
            >
                <ConfigProbe />
            </CratisComponentsProvider>,
        );
        expect(resolvedDatePicker?.today).to.equal('I dag');
        expect(resolvedDatePicker?.clear).to.equal('Tøm');
        expect(resolvedDatePicker?.label).to.equal('Provider Date Label');
    });

    it('should fall back to the default label when no provider label is given, even with legacy locales present', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    locale: 'nb-NO',
                    locales: { 'nb-NO': { today: 'I dag', clear: 'Tøm' } },
                }}
            >
                <ConfigProbe />
            </CratisComponentsProvider>,
        );
        expect(resolvedDatePicker?.label).to.equal('Date');
    });

    it('should leave datePicker messages untouched when no legacy locale entry matches', async () => {
        await render(
            <CratisComponentsProvider
                value={{
                    locale: 'nb-NO',
                    locales: { 'sv-SE': { today: 'Idag' } },
                    messages: { datePicker: { label: 'Provider Date Label' } },
                }}
            >
                <ConfigProbe />
            </CratisComponentsProvider>,
        );
        expect(resolvedDatePicker?.label).to.equal('Provider Date Label');
        expect(resolvedDatePicker?.today).to.equal('Today');
    });
});

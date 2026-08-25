// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { DatePickerInput } from '../DatePickerInput';
import { Dropdown } from '../../Dropdown/Dropdown';
import { Dialog } from '../../Dialogs/Dialog';
import { CommandStepperContent } from '../../CommandDialog/CommandStepperContent';
import { StepperPanel } from '../../CommandDialog/StepperPanel';
import { Toaster, toast } from '../../Notifications';
import { Column } from '../../DataTables/Column';
import { DataTableCore } from '../../DataTables/DataTableCore';

/**
 * Sentinel-provider gate for every owned label audited in this pass: renders every fixed
 * surface at once under a single provider whose messages are all distinct, unmistakable
 * sentinel strings, then asserts every resolved label is that sentinel — never the English
 * default it would render as with no provider configured. A regression that silently drops a
 * provider message back to its English literal fails one of these assertions rather than
 * only a narrower per-component precedence spec.
 */
describe('when every owned label is overridden through the provider', () => {
    let container: HTMLDivElement;
    let root: Root;

    const sentinelMessages = {
        dropdown: {
            showOptions: 'SENTINEL-show-options',
            clearSelection: 'SENTINEL-clear-selection',
        },
        dialog: {
            ok: 'SENTINEL-ok',
            cancel: 'SENTINEL-cancel',
            close: 'SENTINEL-close',
        },
        stepper: {
            next: 'SENTINEL-next',
            previous: 'SENTINEL-previous',
            submit: 'SENTINEL-submit',
        },
        notifications: {
            dismiss: 'SENTINEL-dismiss',
            region: 'SENTINEL-region',
        },
        dataTable: {
            selectRow: 'SENTINEL-select-row',
            search: 'SENTINEL-search',
            searchAriaLabel: 'SENTINEL-search-aria',
        },
        columnFilter: {
            matchModeAriaLabel: 'SENTINEL-match-mode',
            clear: 'SENTINEL-columnfilter-clear',
            apply: 'SENTINEL-apply',
            true: 'SENTINEL-true',
            false: 'SENTINEL-false',
        },
        datePicker: {
            label: 'SENTINEL-date-label',
        },
    };

    const englishDefaults = [
        'Show options',
        'Clear selection',
        'Ok',
        'Cancel',
        'Close',
        'Next',
        'Previous',
        'Submit',
        'Dismiss',
        'Notifications',
        'Select row',
        'Search\u2026',
        'Search table',
        'Match mode',
        'Clear',
        'Apply',
        'True',
        'False',
        'Date',
    ];

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
        toast.dismiss();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider value={{ messages: sentinelMessages }}>
                    <Dropdown
                        value='frontend'
                        options={[{ label: 'Frontend', value: 'frontend' }]}
                        filter
                        showClear
                    />
                    <Dialog title='Sentinel dialog' buttons={DialogButtons.OkCancel}>
                        Body
                    </Dialog>
                    <CommandStepperContent activeStep={0} visitedSteps={new Set([0])}>
                        <StepperPanel header='First'>One</StepperPanel>
                        <StepperPanel header='Second'>Two</StepperPanel>
                    </CommandStepperContent>
                    <Toaster timeout={60_000} />
                    <DataTableCore
                        data={[{ name: 'Morgan', role: true }]}
                        dataKey='name'
                        emptyMessage='No rows'
                        globalFilterFields={['name']}
                        selectionMode='single'
                    >
                        <Column field='name' header='Name' />
                        <Column field='role' header='Role' filter dataType='boolean' />
                        <Column selectionMode='single' />
                    </DataTableCore>
                    <DatePickerInput value={null} onChange={() => undefined} />
                </CratisComponentsProvider>,
            );
        });

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 400));
        });

        await act(async () => {
            toast({ title: 'Hello' });
        });

        const filterTrigger = container.querySelector<HTMLButtonElement>(
            '.cratis-filter-trigger',
        );
        await act(async () => filterTrigger?.click());
    });

    afterEach(async () => {
        await act(async () => {
            toast.dismiss();
            root.unmount();
        });
        container.remove();
    });

    it('should localize the Dropdown show-options and clear-selection labels', () => {
        const trigger = container.querySelector('[data-cratis-part="trigger"]');
        const clear = container.querySelector('[data-cratis-part="clear"]');
        expect(trigger?.getAttribute('aria-label')).to.equal('SENTINEL-show-options');
        expect(clear?.getAttribute('aria-label')).to.equal('SENTINEL-clear-selection');
    });

    it('should localize the Dialog Ok/Cancel/Close labels', () => {
        const buttonLabeled = (label: string) =>
            Array.from(document.querySelectorAll('button')).find(
                (button) => button.textContent === label,
            );
        expect(buttonLabeled('SENTINEL-ok')).not.to.equal(undefined);
        expect(buttonLabeled('SENTINEL-cancel')).not.to.equal(undefined);
        expect(
            document
                .querySelector('[data-cratis-part="close"]')
                ?.getAttribute('aria-label'),
        ).to.equal('SENTINEL-close');
    });

    it('should localize the Stepper Next label', () => {
        const buttonLabeled = (label: string) =>
            Array.from(document.querySelectorAll('button')).find(
                (button) => button.textContent === label,
            );
        expect(buttonLabeled('SENTINEL-next')).not.to.equal(undefined);
    });

    it('should localize the Toaster dismiss and region labels', () => {
        expect(
            document
                .querySelector('[data-cratis-part="region"]')
                ?.getAttribute('aria-label'),
        ).to.equal('SENTINEL-region');
        expect(
            document
                .querySelector('.cratis-toast [data-cratis-part="close"]')
                ?.getAttribute('aria-label'),
        ).to.equal('SENTINEL-dismiss');
    });

    it('should localize the DataTableCore search and selection labels', () => {
        const search = container.querySelector('[data-cratis-part="search-input"]');
        const selection = container.querySelector('input[type="radio"]');
        expect(search?.getAttribute('placeholder')).to.equal('SENTINEL-search');
        expect(search?.getAttribute('aria-label')).to.equal('SENTINEL-search-aria');
        expect(selection?.getAttribute('aria-label')).to.equal('SENTINEL-select-row');
    });

    it('should localize the ColumnFilterMenu clear/apply/boolean/match-mode labels', () => {
        const menu = document.querySelector('.cratis-filter-menu');
        expect(menu?.textContent).to.contain('SENTINEL-columnfilter-clear');
        expect(menu?.textContent).to.contain('SENTINEL-apply');
        expect(menu?.textContent).to.contain('SENTINEL-true');
        expect(menu?.textContent).to.contain('SENTINEL-false');
        expect(menu?.querySelector('[aria-label="SENTINEL-match-mode"]')).not.to.equal(
            null,
        );
    });

    it('should localize the orphaned DatePicker accessible-name fallback', () => {
        const group = container.querySelector('[data-cratis-part="group"]');
        expect(group?.getAttribute('aria-label')).to.equal('SENTINEL-date-label');
    });

    it('should never leave an audited surface showing its English default', () => {
        const attributeValues = Array.from(
            document.querySelectorAll(
                '[data-cratis-part][aria-label], [data-cratis-part][placeholder], [data-cratis-part][title]',
            ),
        ).flatMap((element) => [
            element.getAttribute('aria-label'),
            element.getAttribute('placeholder'),
            element.getAttribute('title'),
        ]);
        const textValues = Array.from(document.querySelectorAll('button')).map(
            (element) => element.textContent,
        );

        for (const englishDefault of englishDefaults) {
            expect(attributeValues).not.to.include(englishDefault);
            expect(textValues).not.to.include(englishDefault);
        }
    });
});

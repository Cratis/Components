// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement } from 'react';
import type { ButtonProps } from '@cratis/components/Common';
import type { CheckboxProps } from '@cratis/components/Common';
import type { DatePickerInputProps } from '@cratis/components/Common';
import type { IconButtonProps } from '@cratis/components/Common';
import type { NumericInputProps } from '@cratis/components/Common';
import type { RadioProps } from '@cratis/components/Common';
import type { SurfaceProps } from '@cratis/components/Common';
import type { SwitchProps } from '@cratis/components/Common';
import type { TextAreaProps } from '@cratis/components/Common';
import type { TextInputProps } from '@cratis/components/Common';
import type { TooltipProps } from '@cratis/components/Common';
import type { TablePaginatorProps } from '@cratis/components/DataTables';
import type { ProgressBarProps } from '@cratis/components/Display';
import type { DialogProps } from '@cratis/components/Dialogs';
import type { DropdownProps } from '@cratis/components/Dropdown';
import type { SlotProfile } from './SlotProfile.js';
import { slotContracts } from './slotContracts.js';
import { slotInteraction } from './slotInteractions.js';

const recordProps = <T extends object>(props: T) => {
    // SAFETY: Slot fixtures preserve the original typed object; the runner reads keys without mutation.
    return props as unknown as Readonly<Record<string, unknown>>;
};

const pause = (milliseconds: number) =>
    new Promise<void>((resolve) => globalThis.setTimeout(resolve, milliseconds));

const click = (container: ParentNode, selector: string) => {
    const element = container.querySelector<HTMLElement>(selector);
    element?.click();
};

const numberInputSlotId = 'common.numberInput';

type Evidence = Map<string, Readonly<Record<string, unknown>>>;

const recordCallbacks = <T extends unknown[]>(
    evidence: Evidence,
    slotId: SlotProfile['slotId'],
    describe: (...values: T) => Readonly<Record<string, unknown>> = () => ({}),
) => {
    let callbacks = 0;
    return (...values: T) => {
        callbacks += 1;
        evidence.set(slotId, { callbacks, ...describe(...values) });
    };
};

const recordChanges = <T,>(
    evidence: Evidence,
    slotId: SlotProfile['slotId'],
    serialize: (value: T) => unknown = (value) => value,
) => recordCallbacks(evidence, slotId, (
    value: T,
    meta?: { source: string; nativeEvent?: Event },
) => ({
    value: serialize(value),
    source: meta?.source,
    nativeEvent: meta?.nativeEvent instanceof Event,
}));

const changeText = (
    container: ParentNode,
    selector: string,
    prototype: HTMLInputElement | HTMLTextAreaElement,
) => {
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (input) {
        Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, 'after');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return input;
};

const typeNumber = (input: HTMLInputElement | null, value: string) => {
    if (!input) {
        return;
    }
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
};

/** Creates fresh public-prop fixtures for all fifteen ABI v1 slots. */
export const createSlotProfiles = (
    evidence: Map<string, Readonly<Record<string, unknown>>>,
): readonly SlotProfile[] => [
    {
        slotId: 'common.button',
        partsKey: 'Button',
        ptKeys: ['root', 'spinner', 'icon', 'label'],
        nativeSelector: 'button',
        nativeTag: 'BUTTON',
        refCapable: true,
        ownershipSelectors: ['button'],
        createProps: () => recordProps({
            label: 'Save',
            icon: createElement('span', null, '+'),
            type: 'submit',
            onClick: recordCallbacks(evidence, 'common.button'),
        } satisfies ButtonProps),
        createStateProps: () =>
            recordProps({
                label: 'Saving',
                loading: true,
                disabled: true,
            } satisfies ButtonProps),
        createPartVariants: () => [
            recordProps({ label: 'Saving', loading: true } satisfies ButtonProps),
        ],
        exercise: async (_document, container) => {
            click(container, 'button');
            return evidence.get('common.button') ?? { callbacks: 0 };
        },
    },
    {
        slotId: 'common.iconButton',
        partsKey: 'IconButton',
        ptKeys: ['root', 'spinner', 'icon', 'label'],
        nativeSelector: 'button',
        nativeTag: 'BUTTON',
        refCapable: true,
        ownershipSelectors: ['button'],
        createProps: () => recordProps({
            icon: createElement('span', null, '+'),
            'aria-label': 'Add item',
            onClick: recordCallbacks(evidence, 'common.iconButton'),
        } satisfies IconButtonProps),
        createStateProps: () =>
            recordProps({
                icon: createElement('span', null, '+'),
                'aria-label': 'Loading',
                loading: true,
            } satisfies IconButtonProps),
        createPartVariants: () => [
            recordProps({
                icon: createElement('span', null, '+'),
                'aria-label': 'Loading',
                loading: true,
            } satisfies IconButtonProps),
        ],
        conditionallyAbsentParts: ['label'],
        exercise: async (_document, container) => {
            click(container, 'button');
            return evidence.get('common.iconButton') ?? { callbacks: 0 };
        },
    },
    {
        slotId: 'common.textInput',
        partsKey: 'TextInput',
        ptKeys: ['root'],
        nativeSelector: 'input[type="text"]',
        nativeTag: 'INPUT',
        refCapable: true,
        ownershipSelectors: ['input[type="text"]'],
        createProps: () => recordProps({
            name: 'sample',
            defaultValue: 'before',
            'aria-label': 'Sample text',
            onChange: recordChanges<string>(evidence, 'common.textInput'),
        } satisfies TextInputProps),
        createStateProps: () =>
            recordProps({
                defaultValue: 'state',
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies TextInputProps),
        exercise: async (_document, container) => {
            const input = changeText(container, 'input[type="text"]', HTMLInputElement.prototype);
            return (
                evidence.get('common.textInput') ?? { callbacks: 0, value: input?.value }
            );
        },
    },
    {
        slotId: numberInputSlotId,
        ...slotContracts[numberInputSlotId],
        partsKey: 'NumericInput',
        ptKeys: ['root'],
        nativeSelector: 'input[type="number"]',
        nativeTag: 'INPUT',
        refCapable: true,
        ownershipSelectors: ['input[type="number"]'],
        createProps: () =>
            recordProps({
                name: 'quantity',
                value: 3,
                'aria-label': 'Sample quantity',
                onChange: recordChanges<number | undefined>(evidence, numberInputSlotId),
            } satisfies NumericInputProps),
        createStateProps: () =>
            recordProps({
                value: 4,
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies NumericInputProps),
        exercise: async (_document, container) => {
            const input = container.querySelector<HTMLInputElement>('input[type="number"]');
            typeNumber(input, '7');
            return evidence.get(numberInputSlotId) ?? { callbacks: 0, value: input?.value };
        },
    },
    {
        slotId: 'common.textArea',
        partsKey: 'TextArea',
        ptKeys: ['root'],
        nativeSelector: 'textarea',
        nativeTag: 'TEXTAREA',
        refCapable: true,
        ownershipSelectors: ['textarea'],
        createProps: () => recordProps({
            name: 'notes',
            defaultValue: 'before',
            'aria-label': 'Sample notes',
            onChange: recordChanges<string>(evidence, 'common.textArea'),
        } satisfies TextAreaProps),
        createStateProps: () =>
            recordProps({
                defaultValue: 'state',
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies TextAreaProps),
        exercise: async (_document, container) => {
            const input = changeText(container, 'textarea', HTMLTextAreaElement.prototype);
            return (
                evidence.get('common.textArea') ?? { callbacks: 0, value: input?.value }
            );
        },
    },
    ...(['common.checkbox', 'common.switch'] as const).map((slotId): SlotProfile => {
        const isSwitch = slotId === 'common.switch';
        return {
            slotId,
            partsKey: isSwitch ? 'Switch' : 'Checkbox',
            ptKeys: isSwitch
                ? ['root', 'input', 'control', 'handle', 'label']
                : ['root', 'input', 'box', 'indicator', 'label'],
            nativeSelector: isSwitch ? 'input[role="switch"]' : 'input[type="checkbox"]',
            nativeTag: 'INPUT',
            refCapable: true,
            ownershipSelectors: [
                isSwitch ? 'input[role="switch"]' : 'input[type="checkbox"]',
            ],
            createProps: () => {
                const onChange = recordChanges<boolean>(evidence, slotId);
                return isSwitch
                    ? recordProps({
                          label: 'Enabled',
                          name: 'enabled',
                          defaultChecked: false,
                          onChange,
                      } satisfies SwitchProps)
                    : recordProps({
                          label: 'Selected',
                          name: 'selected',
                          defaultChecked: false,
                          onChange,
                      } satisfies CheckboxProps);
            },
            createStateProps: () =>
                isSwitch
                    ? recordProps({
                          label: 'State',
                          defaultChecked: true,
                          disabled: true,
                          invalid: true,
                          readOnly: true,
                      } satisfies SwitchProps)
                    : recordProps({
                          label: 'State',
                          defaultChecked: true,
                          disabled: true,
                          invalid: true,
                          readOnly: true,
                      } satisfies CheckboxProps),
            exercise: async (_document, container) => {
                click(
                    container,
                    isSwitch ? 'input[role="switch"]' : 'input[type="checkbox"]',
                );
                return evidence.get(slotId) ?? { callbacks: 0 };
            },
        };
    }),
    {
        slotId: 'common.radio',
        partsKey: 'Radio',
        ptKeys: ['root', 'input', 'box', 'indicator', 'label'],
        nativeSelector: 'input[type="radio"]',
        nativeTag: 'INPUT',
        refCapable: true,
        ownershipSelectors: ['input[type="radio"]'],
        createProps: () => recordProps({
            label: 'Daily',
            name: 'frequency',
            value: 'daily',
            defaultChecked: false,
            onChange: recordChanges<boolean>(evidence, 'common.radio'),
        } satisfies RadioProps),
        createStateProps: () =>
            recordProps({
                label: 'Daily',
                name: 'frequency',
                value: 'daily',
                defaultChecked: true,
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies RadioProps),
        exercise: async (_document, container) => {
            click(container, 'input[type="radio"]');
            return evidence.get('common.radio') ?? { callbacks: 0 };
        },
    },
    {
        slotId: 'common.progress',
        partsKey: 'ProgressBar',
        ptKeys: [],
        nativeSelector: '[role="progressbar"]',
        nativeTag: 'DIV',
        refCapable: false,
        ownershipSelectors: ['[role="progressbar"]'],
        createProps: () =>
            recordProps({
                value: 42,
                'aria-label': 'Progress',
            } satisfies ProgressBarProps),
        createStateProps: () =>
            recordProps({ value: 42, mode: 'indeterminate' } satisfies ProgressBarProps),
        exercise: async (_document, container) => ({
            valueNow: container
                .querySelector('[role="progressbar"]')
                ?.getAttribute('aria-valuenow'),
        }),
    },
    {
        slotId: 'common.surface',
        partsKey: 'Surface',
        ptKeys: ['root'],
        nativeSelector: 'article',
        nativeTag: 'ARTICLE',
        refCapable: true,
        ownershipSelectors: ['article'],
        createProps: () =>
            recordProps({ as: 'article', children: 'Content' } satisfies SurfaceProps),
        exercise: async (_document, container) => ({
            text: container.querySelector('article')?.textContent,
        }),
    },
    {
        slotId: 'common.tooltip',
        ...slotContracts['common.tooltip'],
        interact: slotInteraction(evidence, 'common.tooltip'),
        partsKey: 'Tooltip',
        ptKeys: [],
        nativeSelector: '[data-cratis-part="trigger"]',
        nativeTag: 'BUTTON',
        refCapable: false,
        ownershipSelectors: ['[data-cratis-part="trigger"]'],
        createProps: () =>
            recordProps({
                // A React node, not a string: Tooltip content accepts any node since 4.16.0, and an
                // adapter must render it as-is rather than coerce it to text.
                content: createElement('span', null, 'Save ', createElement('strong', null, 'changes')),
                children: createElement(
                    'button',
                    { type: 'button', className: 'sample-trigger' },
                    'Save',
                ),
            } satisfies TooltipProps),
        activate: async (_document, container) => {
            const trigger = container.querySelector<HTMLElement>(
                '[data-cratis-part="trigger"]',
            );
            trigger?.focus();
            trigger?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            await pause(1700);
        },
        exercise: async (document) => ({
            popupCount: document.querySelectorAll('[data-cratis-part="popup"]').length,
            popupEmphasis: document.querySelector('[data-cratis-part="popup"] strong')?.textContent,
        }),
    },
    {
        slotId: 'dropdown.select',
        ...slotContracts['dropdown.select'],
        interact: slotInteraction(evidence, 'dropdown.select'),
        partsKey: 'Dropdown',
        ptKeys: [
            'root',
            'value',
            'filter',
            'trigger',
            'clear',
            'popover',
            'listbox',
            'option',
            'multiple',
            'indicator',
        ],
        nativeSelector: '[data-cratis-part="trigger"]',
        nativeTag: 'BUTTON',
        refCapable: false,
        ownershipSelectors: ['[data-cratis-part="trigger"]'],
        createProps: () => {
            const props = {
                name: 'role',
                value: null,
                filter: true,
                options: [
                    { label: 'Developer', value: 'developer' },
                    { label: 'Administrator', value: 'admin', disabled: true },
                    { label: 'Viewer', value: 'viewer' },
                ],
                optionLabel: 'label',
                optionValue: 'value',
                showClear: true,
                'aria-label': 'Role',
                onChange: recordChanges<string | null>(evidence, 'dropdown.select'),
            } satisfies DropdownProps<string | null>;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                value: ['admin'],
                options: [{ label: 'Administrator', value: 'admin' }],
                optionLabel: 'label',
                optionValue: 'value',
                filter: true,
                multiple: true,
                showClear: true,
                disabled: true,
                invalid: true,
                'aria-label': 'Role',
            } satisfies DropdownProps<string[]>),
        createPartVariants: () => [
            recordProps({
                value: ['admin'],
                options: [{ label: 'Administrator', value: 'admin' }],
                optionLabel: 'label',
                optionValue: 'value',
                multiple: true,
                'aria-label': 'Role',
            } satisfies DropdownProps<string[]>),
            recordProps({
                value: ['admin'],
                options: [{ label: 'Administrator', value: 'admin' }],
                optionLabel: 'label',
                optionValue: 'value',
                multiple: true,
                disabled: true,
                invalid: true,
                'aria-label': 'Disabled role selection',
            } satisfies DropdownProps<string[]>),
            recordProps({
                value: 'admin',
                options: [{ label: 'Administrator', value: 'admin' }],
                optionLabel: 'label',
                optionValue: 'value',
                showClear: true,
                'aria-label': 'Role',
            } satisfies DropdownProps<string>),
            recordProps({
                value: 'admin',
                options: [{ label: 'Administrator', value: 'admin' }],
                optionLabel: 'label',
                optionValue: 'value',
                showClear: true,
                disabled: true,
                invalid: true,
                'aria-label': 'Role',
            } satisfies DropdownProps<string>),
        ],
        activate: async (_document, container) => {
            click(container, '[data-cratis-part="trigger"]');
            await pause(50);
        },
        exercise: async (document, container) => {
            let option = Array.from(
                document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'),
            ).find((candidate) => candidate.textContent?.includes('Viewer'));
            if (!option) {
                click(container, '[data-cratis-part="trigger"]');
                await pause(50);
                option = Array.from(
                    document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]'),
                ).find((candidate) => candidate.textContent?.includes('Viewer'));
            }
            if (option) {
                for (const type of ['pointerdown', 'pointerup'] as const) {
                    const event = new MouseEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        button: 0,
                    });
                    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
                    option.dispatchEvent(event);
                }
                option.click();
            }
            await pause(0);
            return (
                evidence.get('dropdown.select') ?? {
                    callbacks: 0,
                    optionCount: document.querySelectorAll('[data-cratis-part="option"]')
                        .length,
                }
            );
        },
    },
    {
        slotId: 'dialogs.dialog',
        ...slotContracts['dialogs.dialog'],
        interact: slotInteraction(evidence, 'dialogs.dialog'),
        partsKey: 'Dialog',
        ptKeys: [
            'backdrop',
            'positioner',
            'root',
            'header',
            'title',
            'subtitle',
            'headerActions',
            'close',
            'content',
            'footer',
            'confirm',
            'cancel',
        ],
        nativeSelector: '[role="dialog"]',
        nativeTag: 'SECTION',
        // An adapter dialog may be a native modal `<dialog>`: the browser top layer then owns the
        // backdrop and positioning, so those two parts have no element.
        platformRoot: { selector: 'dialog', tag: 'DIALOG', ownedParts: ['backdrop', 'positioner'] },
        refCapable: false,
        ownershipSelectors: ['[role="dialog"], dialog'],
        createProps: () => {
            const props = {
                title: 'Example dialog',
                subtitle: 'Example subtitle',
                headerActions: <button type='button'>Example action</button>,
                children: 'Dialog content',
                buttons: 2,
                dismissable: true,
                onClose: recordCallbacks(evidence, 'dialogs.dialog'),
            } satisfies DialogProps;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                title: 'Busy dialog',
                subtitle: 'Busy subtitle',
                children: 'Dialog content',
                buttons: 2,
                isBusy: true,
            } satisfies DialogProps),
        exercise: async (document) => {
            click(document, '[data-cratis-part="close"]');
            await pause(0);
            return evidence.get('dialogs.dialog') ?? { callbacks: 0 };
        },
    },
    {
        slotId: 'display.datePicker',
        ...slotContracts['display.datePicker'],
        interact: slotInteraction(evidence, 'display.datePicker'),
        partsKey: 'DatePickerInput',
        ptKeys: [
            'root',
            'group',
            'input',
            'segment',
            'placeholder',
            'trigger',
            'popover',
            'dialog',
            'calendar',
            'header',
            'previous',
            'heading',
            'next',
            'grid',
            'cell',
            'buttonBar',
            'today',
            'clear',
        ],
        nativeSelector: '[data-cratis-part="group"]',
        nativeTag: 'DIV',
        refCapable: false,
        ownershipSelectors: ['[data-cratis-part="group"]'],
        createProps: () => {
            const props = {
                value: null,
                showButtonBar: true,
                placeholder: 'Choose a date',
                'aria-label': 'Delivery date',
                onChange: recordChanges<Date | null>(evidence, 'display.datePicker', (value) => value?.toISOString()),
            } satisfies DatePickerInputProps;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                value: new Date(2024, 5, 15),
                disabled: true,
                invalid: true,
                readOnly: true,
                'aria-label': 'Delivery date',
                onChange: () => undefined,
            } satisfies DatePickerInputProps),
        createPartVariants: () => [
            recordProps({
                value: new Date(2024, 5, 15),
                showButtonBar: true,
                'aria-label': 'Selected delivery date',
                onChange: () => undefined,
            } satisfies DatePickerInputProps),
            recordProps({
                value: new Date(2100, 0, 2),
                minDate: new Date(2100, 0, 1),
                showButtonBar: true,
                'aria-label': 'Bounded delivery date',
                onChange: () => undefined,
            } satisfies DatePickerInputProps),
            recordProps({
                value: new Date(2024, 5, 15),
                showButtonBar: true,
                pt: { clear: { disabled: true } },
                'aria-label': 'Required delivery date',
                onChange: () => undefined,
            } satisfies DatePickerInputProps),
        ],
        activate: async (_document, container) => {
            click(container, '[data-cratis-part="trigger"]');
            await pause(50);
        },
        exercise: async (document) => {
            click(document, '[data-cratis-part="today"]');
            await pause(0);
            return (
                evidence.get('display.datePicker') ?? {
                    callbacks: 0,
                    cellCount: document.querySelectorAll('[data-cratis-part="cell"]')
                        .length,
                }
            );
        },
    },
    {
        slotId: 'datatables.paginator',
        ...slotContracts['datatables.paginator'],
        interact: slotInteraction(evidence, 'datatables.paginator'),
        partsKey: 'TablePaginator',
        ptKeys: [
            'root',
            'range',
            'info',
            'pages',
            'page',
            'ellipsis',
            'first',
            'previous',
            'next',
            'last',
        ],
        nativeSelector: '[role="navigation"]',
        nativeTag: 'DIV',
        refCapable: false,
        ownershipSelectors: ['[role="navigation"]'],
        createProps: () => {
            const props = {
                page: 1,
                pageCount: 3,
                totalItems: 30,
                pageSize: 10,
                onPageChange: recordCallbacks(evidence, 'datatables.paginator', (page: number) => ({ page })),
            } satisfies TablePaginatorProps;
            return recordProps(props);
        },
        createPartVariants: () => [
            recordProps({
                page: 5,
                pageCount: 12,
                totalItems: 120,
                pageSize: 10,
                pageLinks: true,
                onPageChange: () => undefined,
            } satisfies TablePaginatorProps),
        ],
        exercise: async (_document, container) => {
            click(container, '[aria-label="Next page"]');
            await pause(0);
            return evidence.get('datatables.paginator') ?? { callbacks: 0 };
        },
    },
];

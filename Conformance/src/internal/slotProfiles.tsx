// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement } from 'react';
import type { ButtonProps } from '@cratis/components/Common';
import type { CheckboxProps } from '@cratis/components/Common';
import type { DatePickerInputProps } from '@cratis/components/Common';
import type { IconButtonProps } from '@cratis/components/Common';
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

/** Creates fresh public-prop fixtures for all fourteen ABI v1 slots. */
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
        createProps: () => {
            let callbacks = 0;
            const props = {
                label: 'Save',
                icon: createElement('span', null, '+'),
                type: 'submit',
                onClick: () => {
                    callbacks += 1;
                    evidence.set('common.button', { callbacks });
                },
            } satisfies ButtonProps;
            return recordProps(props);
        },
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
        createProps: () => {
            let callbacks = 0;
            const props = {
                icon: createElement('span', null, '+'),
                'aria-label': 'Add item',
                onClick: () => {
                    callbacks += 1;
                    evidence.set('common.iconButton', { callbacks });
                },
            } satisfies IconButtonProps;
            return recordProps(props);
        },
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
        createProps: () => {
            let callbacks = 0;
            const props = {
                name: 'sample',
                defaultValue: 'before',
                'aria-label': 'Sample text',
                onChange: (value, meta) => {
                    callbacks += 1;
                    evidence.set('common.textInput', {
                        callbacks,
                        value,
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                },
            } satisfies TextInputProps;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                defaultValue: 'state',
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies TextInputProps),
        exercise: async (_document, container) => {
            const input = container.querySelector<HTMLInputElement>('input[type="text"]');
            if (input) {
                Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value',
                )?.set?.call(input, 'after');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return (
                evidence.get('common.textInput') ?? { callbacks: 0, value: input?.value }
            );
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
        createProps: () => {
            let callbacks = 0;
            const props = {
                name: 'notes',
                defaultValue: 'before',
                'aria-label': 'Sample notes',
                onChange: (value, meta) => {
                    callbacks += 1;
                    evidence.set('common.textArea', {
                        callbacks,
                        value,
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                },
            } satisfies TextAreaProps;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                defaultValue: 'state',
                disabled: true,
                invalid: true,
                readOnly: true,
            } satisfies TextAreaProps),
        exercise: async (_document, container) => {
            const input = container.querySelector<HTMLTextAreaElement>('textarea');
            if (input) {
                Object.getOwnPropertyDescriptor(
                    HTMLTextAreaElement.prototype,
                    'value',
                )?.set?.call(input, 'after');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
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
                let callbacks = 0;
                const onChange = (
                    value: boolean,
                    meta?: { source: string; nativeEvent?: Event },
                ) => {
                    callbacks += 1;
                    evidence.set(slotId, {
                        callbacks,
                        value,
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                };
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
        createProps: () => {
            let callbacks = 0;
            const props = {
                label: 'Daily',
                name: 'frequency',
                value: 'daily',
                defaultChecked: false,
                onChange: (value, meta) => {
                    callbacks += 1;
                    evidence.set('common.radio', {
                        callbacks,
                        value,
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                },
            } satisfies RadioProps;
            return recordProps(props);
        },
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
        partsKey: 'Tooltip',
        ptKeys: [],
        nativeSelector: '[data-cratis-part="trigger"]',
        nativeTag: 'BUTTON',
        refCapable: false,
        ownershipSelectors: ['[data-cratis-part="trigger"]'],
        createProps: () =>
            recordProps({
                content: 'Save changes',
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
        }),
    },
    {
        slotId: 'dropdown.select',
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
            let callbacks = 0;
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
                onChange: (value, meta) => {
                    callbacks += 1;
                    evidence.set('dropdown.select', {
                        callbacks,
                        value,
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                },
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
        partsKey: 'Dialog',
        ptKeys: [
            'backdrop',
            'positioner',
            'root',
            'header',
            'title',
            'close',
            'content',
            'footer',
            'confirm',
            'cancel',
        ],
        nativeSelector: '[role="dialog"]',
        nativeTag: 'SECTION',
        refCapable: false,
        ownershipSelectors: ['[role="dialog"]'],
        createProps: () => {
            let callbacks = 0;
            const props = {
                title: 'Example dialog',
                children: 'Dialog content',
                buttons: 2,
                dismissable: true,
                onClose: () => {
                    callbacks += 1;
                    evidence.set('dialogs.dialog', { callbacks });
                },
            } satisfies DialogProps;
            return recordProps(props);
        },
        createStateProps: () =>
            recordProps({
                title: 'Busy dialog',
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
            let callbacks = 0;
            const props = {
                value: null,
                showButtonBar: true,
                placeholder: 'Choose a date',
                'aria-label': 'Delivery date',
                onChange: (value, meta) => {
                    callbacks += 1;
                    evidence.set('display.datePicker', {
                        callbacks,
                        value: value?.toISOString(),
                        source: meta?.source,
                        nativeEvent: meta?.nativeEvent instanceof Event,
                    });
                },
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
        partsKey: 'TablePaginator',
        ptKeys: ['root', 'range', 'info', 'first', 'previous', 'next', 'last'],
        nativeSelector: '[role="navigation"]',
        nativeTag: 'DIV',
        refCapable: false,
        ownershipSelectors: ['[role="navigation"]'],
        createProps: () => {
            let callbacks = 0;
            const props = {
                page: 1,
                pageCount: 3,
                totalItems: 30,
                pageSize: 10,
                onPageChange: (page) => {
                    callbacks += 1;
                    evidence.set('datatables.paginator', { callbacks, page });
                },
            } satisfies TablePaginatorProps;
            return recordProps(props);
        },
        exercise: async (_document, container) => {
            click(container, '[aria-label="Next page"]');
            await pause(0);
            return evidence.get('datatables.paginator') ?? { callbacks: 0 };
        },
    },
];

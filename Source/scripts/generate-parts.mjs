// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Canonical component-to-part manifest and the source ownership needed to verify it.
 *
 * `parts` are the stable `data-cratis-part` values exposed by the component.
 * `ptKeys` records the public pass-through keys when those intentionally differ from
 * the DOM marker (for example ToolbarGroup's `root` key emits `toolbar-group`).
 * `aliasOf` records components whose `pt` contract and emitted parts are delegated.
 */
export const partDefinitions = {
    CheckboxField: {
        parts: ['root', 'input', 'box', 'indicator'],
        sources: ['CommandForm/fields/CheckboxField.tsx'],
        ptKeys: ['root', 'input', 'box', 'indicator'],
    },
    RatingField: {
        parts: ['root', 'option', 'input', 'star'],
        sources: ['CommandForm/fields/RatingField.tsx'],
        ptKeys: ['root', 'option', 'input', 'star'],
    },
    RadioButtonField: {
        parts: ['root', 'input', 'box', 'indicator'],
        sources: ['CommandForm/fields/RadioButtonField.tsx'],
        ptKeys: ['root', 'input', 'box', 'indicator'],
    },
    RadioGroupField: {
        parts: ['root', 'option', 'input', 'box', 'indicator'],
        sources: ['CommandForm/fields/RadioGroupField.tsx'],
        ptKeys: ['root', 'option', 'input', 'box', 'indicator'],
    },
    ChipsField: {
        parts: ['root', 'item', 'remove', 'input'],
        sources: ['CommandForm/fields/ChipsField.tsx'],
        ptKeys: ['root', 'item', 'remove', 'input'],
    },
    ToggleSwitchField: {
        parts: ['root', 'input', 'control', 'handle'],
        sources: ['CommandForm/fields/ToggleSwitchField.tsx'],
        ptKeys: ['root', 'input', 'control', 'handle'],
    },
    SliderField: {
        parts: ['root', 'input', 'value'],
        sources: ['CommandForm/fields/SliderField.tsx'],
        ptKeys: ['root', 'input', 'value'],
    },
    NumberField: {
        parts: ['root', 'input'],
        sources: ['CommandForm/fields/NumberField.tsx'],
        ptKeys: ['root', 'input'],
    },
    ColorPickerField: {
        parts: ['root', 'input', 'value'],
        sources: ['CommandForm/fields/ColorPickerField.tsx'],
        ptKeys: ['root', 'input', 'value'],
    },
    PasswordField: {
        parts: ['root', 'input', 'toggle'],
        sources: ['CommandForm/fields/PasswordField.tsx'],
        ptKeys: ['root', 'input', 'toggle'],
    },
    InputTextField: {
        parts: ['input'],
        sources: ['CommandForm/fields/InputTextField.tsx'],
        ptKeys: ['root'],
    },
    TextAreaField: {
        parts: ['textarea'],
        sources: ['CommandForm/fields/TextAreaField.tsx'],
        ptKeys: ['root'],
    },
    Dropdown: {
        parts: [
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
        sources: ['Dropdown/DropdownImplementation.tsx'],
        ptFiles: ['Dropdown/Dropdown.tsx'],
        ptKeys: [
            'root',
            'input',
            'select',
            'trigger',
            'value',
            'clear',
            'indicator',
            'popover',
            'listbox',
            'option',
            'filter',
            'multiple',
        ],
    },
    DropdownField: {
        aliasOf: 'Dropdown',
        sources: ['CommandForm/fields/DropdownField.tsx'],
    },
    MultiSelectField: {
        aliasOf: 'Dropdown',
        sources: ['CommandForm/fields/MultiSelectField.tsx'],
    },
    DatePickerInput: {
        parts: [
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
            'button-bar',
            'today',
            'clear',
        ],
        sources: ['Common/DatePickerInputImplementation.tsx'],
        ptFiles: ['Common/DatePickerInput.tsx'],
        ptKeys: [
            'root',
            'group',
            'input',
            'placeholder',
            'segment',
            'trigger',
            'popover',
            'dialog',
            'calendar',
            'header',
            'heading',
            'previous',
            'next',
            'grid',
            'cell',
            'buttonBar',
            'today',
            'clear',
        ],
    },
    CalendarField: {
        aliasOf: 'DatePickerInput',
        sources: ['CommandForm/fields/CalendarField.tsx'],
    },
    Button: {
        parts: ['root', 'spinner', 'icon', 'label'],
        sources: ['Common/ButtonImplementation.tsx'],
        ptFiles: ['Common/Button.tsx'],
        ptKeys: ['root', 'icon', 'label', 'spinner'],
    },
    ActionMenubar: {
        aliasOf: 'Button',
        sources: ['Common/ActionMenubar.tsx'],
    },
    IconButton: {
        aliasOf: 'Button',
        sources: ['Common/IconButtonImplementation.tsx'],
        ptFiles: ['Common/IconButton.tsx'],
    },
    TextInput: {
        parts: ['root'],
        sources: ['Common/TextInputImplementation.tsx'],
        ptFiles: ['Common/TextInput.tsx'],
        ptKeys: ['root'],
    },
    TextArea: {
        parts: ['root'],
        sources: ['Common/TextAreaImplementation.tsx'],
        ptFiles: ['Common/TextArea.tsx'],
        ptKeys: ['root'],
    },
    Checkbox: {
        parts: ['root', 'input', 'box', 'indicator', 'label'],
        sources: ['Common/CheckboxImplementation.tsx'],
        ptFiles: ['Common/Checkbox.tsx'],
        ptKeys: ['root', 'input', 'box', 'indicator', 'label'],
    },
    Radio: {
        parts: ['root', 'input', 'box', 'indicator', 'label'],
        sources: ['Common/RadioImplementation.tsx'],
        ptFiles: ['Common/Radio.tsx'],
        ptKeys: ['root', 'input', 'box', 'indicator', 'label'],
    },
    Switch: {
        parts: ['root', 'input', 'control', 'handle', 'label'],
        sources: ['Common/SwitchImplementation.tsx'],
        ptFiles: ['Common/Switch.tsx'],
        ptKeys: ['root', 'input', 'control', 'handle', 'label'],
    },
    Surface: {
        parts: ['root'],
        sources: ['Common/SurfaceImplementation.tsx'],
        ptFiles: ['Common/Surface.tsx'],
        ptKeys: ['root'],
    },
    Tooltip: {
        parts: ['trigger', 'popup'],
        sources: ['Common/TooltipImplementation.tsx'],
    },
    Dialog: {
        parts: [
            'backdrop',
            'positioner',
            'root',
            'header',
            'title',
            'close',
            'content',
            'busy-scope',
            'footer',
            'confirm',
            'cancel',
        ],
        sources: ['Dialogs/DialogImplementation.tsx'],
        ptFiles: ['Dialogs/Dialog.tsx'],
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
    },
    CommandDialog: {
        aliasOf: 'Dialog',
        sources: ['CommandDialog/CommandDialog.tsx'],
    },
    CommandStepper: {
        parts: [
            'root',
            'list',
            'step',
            'header',
            'number',
            'title',
            'separator',
            'panels',
            'panel',
        ],
        sources: ['CommandDialog/CommandStepperContent.tsx'],
        ptFiles: ['CommandDialog/CommandStepper.tsx'],
        ptKeys: [
            'root',
            'list',
            'step',
            'header',
            'number',
            'title',
            'separator',
            'panels',
            'panel',
        ],
    },
    DataTableCore: {
        parts: [
            'root',
            'search',
            'search-input',
            'table-container',
            'table',
            'head',
            'header-row',
            'header-cell',
            'header-content',
            'sort',
            'body',
            'empty-row',
            'empty-cell',
            'row',
            'cell',
        ],
        sources: ['DataTables/DataTableCore.tsx'],
        ptKeys: [
            'root',
            'search',
            'searchInput',
            'tableContainer',
            'table',
            'head',
            'headerRow',
            'headerCell',
            'body',
            'row',
            'cell',
            'emptyRow',
            'emptyCell',
        ],
    },
    DataTableForObservableQuery: {
        aliasOf: 'DataTableCore',
        sources: ['DataTables/DataTableForObservableQuery.tsx'],
    },
    DataTableForQuery: {
        aliasOf: 'DataTableCore',
        sources: ['DataTables/DataTableForQuery.tsx'],
    },
    ColumnFilterMenu: {
        parts: ['filter-trigger', 'filter-popover', 'filter-menu', 'filter-actions'],
        sources: ['DataTables/ColumnFilterMenu.tsx'],
        ptKeys: [
            'trigger',
            'popover',
            'menu',
            'matchMode',
            'input',
            'actions',
            'clear',
            'apply',
        ],
    },
    TablePaginator: {
        parts: ['root', 'range', 'info'],
        sources: ['DataTables/TablePaginatorImplementation.tsx'],
        ptFiles: ['DataTables/TablePaginator.tsx'],
        ptKeys: ['root', 'range', 'info', 'first', 'previous', 'next', 'last'],
    },
    Toaster: {
        parts: [
            'region',
            'toast',
            'icon',
            'content',
            'title',
            'description',
            'close',
            'action',
        ],
        sources: ['Notifications/Toaster.tsx'],
        ptKeys: [
            'region',
            'toast',
            'icon',
            'content',
            'title',
            'description',
            'close',
            'action',
        ],
    },
    EventsView: {
        parts: ['timeline', 'event', 'separator', 'marker', 'connector', 'content'],
        sources: ['TimeMachine/EventsView.tsx'],
        ptKeys: ['timeline', 'event', 'separator', 'marker', 'connector', 'content'],
    },
    ChatSidebar: {
        parts: ['backdrop', 'root', 'header', 'back', 'title', 'close', 'content'],
        sources: ['Chat/ChatSidebar.tsx'],
        ptKeys: ['backdrop', 'root', 'header', 'title', 'back', 'close', 'content'],
    },
    Toolbar: {
        parts: ['root'],
        sources: ['Toolbar/Toolbar.tsx'],
        ptKeys: ['root'],
    },
    ToolbarButton: {
        parts: ['button', 'icon', 'label'],
        sources: ['Toolbar/ToolbarButton.tsx'],
        ptKeys: ['root', 'icon', 'label'],
    },
    ToolbarFolder: {
        parts: ['toolbar-folder', 'toolbar-folder-trigger', 'toolbar-folder-panel'],
        sources: ['Toolbar/ToolbarFolder.tsx'],
        ptKeys: ['root', 'trigger', 'panel'],
    },
    ToolbarFanOutItem: {
        parts: ['fanout-root', 'fanout-trigger', 'fanout-panel'],
        sources: ['Toolbar/ToolbarFanOutItem.tsx'],
        ptKeys: ['root', 'trigger', 'panel'],
    },
    ToolbarSeparator: {
        parts: ['toolbar-separator'],
        sources: ['Toolbar/ToolbarSeparator.tsx'],
        ptKeys: ['root'],
    },
    ToolbarSection: {
        parts: ['toolbar-section', 'toolbar-context'],
        sources: ['Toolbar/ToolbarSection.tsx'],
        ptKeys: ['root', 'context'],
    },
    ToolbarGroup: {
        parts: [
            'toolbar-group',
            'toolbar-slot',
            'toolbar-slot-incoming',
            'toolbar-slot-outgoing',
        ],
        sources: ['Toolbar/ToolbarGroup.tsx'],
        ptKeys: ['root', 'slot', 'incoming', 'outgoing'],
    },
    ToolbarLayout: {
        parts: [
            'toolbar-layout',
            'toolbar-slot',
            'toolbar-slot-incoming',
            'toolbar-slot-outgoing',
        ],
        sources: ['Toolbar/ToolbarLayout.tsx'],
        ptKeys: ['root', 'slot', 'incoming', 'outgoing'],
    },
    Skeleton: {
        parts: ['root'],
        sources: ['Display/Skeleton.tsx'],
    },
    Message: {
        parts: ['root', 'icon', 'text'],
        sources: ['Display/Message.tsx'],
    },
    Badge: {
        parts: ['root'],
        sources: ['Display/Badge.tsx'],
    },
    ProgressSpinner: {
        parts: ['root', 'svg', 'track', 'range'],
        sources: ['Display/ProgressSpinner.tsx'],
    },
    Avatar: {
        parts: ['root', 'image', 'fallback'],
        sources: ['Display/Avatar.tsx'],
    },
    Tag: {
        parts: ['root', 'icon', 'label'],
        sources: ['Display/Tag.tsx'],
    },
    ProgressBar: {
        parts: ['root', 'indicator', 'label'],
        sources: ['Display/ProgressBarImplementation.tsx'],
    },
    Chip: {
        parts: ['root', 'icon', 'label', 'remove'],
        sources: ['Display/Chip.tsx'],
    },
};

/** Canonical boolean state attributes supported by the stable-parts contract. */
export const canonicalPartStateNames = [
    'disabled',
    'loading',
    'selected',
    'open',
    'invalid',
    'readonly',
    'busy',
    'focused',
    'pressed',
];

/**
 * Allowed canonical states for every part owned directly by a component definition.
 * Empty arrays are intentional: static parts remain explicitly state-free.
 * Aliases inherit the complete state contract of their target.
 */
export const partStateDefinitions = {
    CheckboxField: {
        root: ['disabled', 'selected', 'invalid'],
        input: ['disabled', 'selected', 'invalid'],
        box: ['disabled', 'selected', 'invalid'],
        indicator: ['disabled', 'selected', 'invalid'],
    },
    RatingField: {
        root: ['disabled', 'invalid'],
        option: ['disabled', 'selected', 'invalid'],
        input: ['disabled', 'selected', 'invalid'],
        star: ['disabled', 'selected', 'invalid'],
    },
    RadioButtonField: {
        root: ['disabled', 'selected', 'invalid'],
        input: ['disabled', 'selected', 'invalid'],
        box: ['disabled', 'selected', 'invalid'],
        indicator: ['disabled', 'selected', 'invalid'],
    },
    RadioGroupField: {
        root: ['disabled', 'invalid'],
        option: ['disabled', 'selected', 'invalid'],
        input: ['disabled', 'selected', 'invalid'],
        box: ['disabled', 'selected', 'invalid'],
        indicator: ['disabled', 'selected', 'invalid'],
    },
    ChipsField: {
        root: ['disabled', 'invalid', 'readonly'],
        item: ['selected'],
        remove: ['disabled', 'selected'],
        input: ['disabled', 'invalid', 'readonly'],
    },
    ToggleSwitchField: {
        root: ['disabled', 'selected', 'invalid'],
        input: ['disabled', 'selected', 'invalid'],
        control: ['disabled', 'selected', 'invalid'],
        handle: ['disabled', 'selected', 'invalid'],
    },
    SliderField: {
        root: ['disabled', 'invalid'],
        input: ['disabled', 'invalid'],
        value: ['invalid'],
    },
    NumberField: {
        root: ['disabled', 'invalid', 'readonly'],
        input: ['disabled', 'invalid', 'readonly'],
    },
    ColorPickerField: {
        root: ['disabled', 'invalid'],
        input: ['disabled', 'invalid'],
        value: ['invalid'],
    },
    PasswordField: {
        root: ['disabled', 'invalid', 'readonly'],
        input: ['disabled', 'invalid', 'readonly'],
        toggle: ['disabled'],
    },
    InputTextField: {
        input: ['disabled', 'invalid', 'readonly'],
    },
    TextAreaField: {
        textarea: ['disabled', 'invalid', 'readonly'],
    },
    Dropdown: {
        root: ['disabled', 'selected', 'open', 'invalid'],
        value: ['disabled', 'selected', 'open', 'invalid'],
        filter: ['disabled', 'open', 'invalid'],
        trigger: ['disabled', 'selected', 'open', 'invalid'],
        clear: ['disabled'],
        popover: ['open'],
        listbox: ['open'],
        option: ['disabled', 'selected'],
        multiple: ['disabled', 'selected', 'invalid'],
        indicator: ['disabled', 'open', 'invalid'],
    },
    DatePickerInput: {
        root: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
        group: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
        input: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
        segment: ['disabled', 'invalid', 'readonly'],
        placeholder: [],
        trigger: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
        popover: ['open'],
        dialog: ['open'],
        calendar: ['open'],
        header: [],
        previous: [],
        heading: [],
        next: [],
        grid: [],
        cell: ['selected'],
        'button-bar': [],
        today: ['disabled'],
        clear: [],
    },
    Button: {
        root: ['disabled', 'loading'],
        spinner: [],
        icon: [],
        label: [],
    },
    TextInput: {
        root: ['disabled', 'invalid', 'readonly'],
    },
    TextArea: {
        root: ['disabled', 'invalid', 'readonly'],
    },
    Checkbox: {
        root: ['disabled', 'selected', 'invalid', 'readonly'],
        input: ['disabled', 'selected', 'invalid', 'readonly'],
        box: ['disabled', 'selected', 'invalid', 'readonly'],
        indicator: ['disabled', 'selected', 'invalid', 'readonly'],
        label: ['disabled', 'selected', 'invalid', 'readonly'],
    },
    Radio: {
        root: ['disabled', 'selected', 'invalid', 'readonly'],
        input: ['disabled', 'selected', 'invalid', 'readonly'],
        box: ['disabled', 'selected', 'invalid', 'readonly'],
        indicator: ['disabled', 'selected', 'invalid', 'readonly'],
        label: ['disabled', 'selected', 'invalid', 'readonly'],
    },
    Switch: {
        root: ['disabled', 'selected', 'invalid', 'readonly'],
        input: ['disabled', 'selected', 'invalid', 'readonly'],
        control: ['disabled', 'selected', 'invalid', 'readonly'],
        handle: ['disabled', 'selected', 'invalid', 'readonly'],
        label: ['disabled', 'selected', 'invalid', 'readonly'],
    },
    Surface: {
        root: [],
    },
    Tooltip: {
        trigger: [],
        popup: ['open'],
    },
    Dialog: {
        backdrop: ['open', 'busy'],
        positioner: ['open', 'busy'],
        root: ['open', 'busy'],
        header: [],
        title: [],
        close: ['disabled', 'busy'],
        content: ['open', 'busy'],
        'busy-scope': ['busy'],
        footer: [],
        confirm: ['disabled', 'busy'],
        cancel: ['disabled', 'busy'],
    },
    CommandStepper: {
        root: ['invalid', 'busy'],
        list: ['invalid', 'busy'],
        step: ['selected', 'invalid', 'busy'],
        header: ['disabled', 'selected', 'invalid', 'busy'],
        number: ['selected', 'invalid', 'busy'],
        title: ['selected', 'invalid', 'busy'],
        separator: ['invalid', 'busy'],
        panels: ['invalid', 'busy'],
        panel: ['selected', 'invalid', 'busy'],
    },
    DataTableCore: {
        root: [],
        search: [],
        'search-input': [],
        'table-container': [],
        table: [],
        head: [],
        'header-row': [],
        'header-cell': ['selected'],
        'header-content': ['selected'],
        sort: ['pressed'],
        body: [],
        'empty-row': [],
        'empty-cell': [],
        row: ['selected'],
        cell: ['selected'],
    },
    ColumnFilterMenu: {
        'filter-trigger': ['selected', 'open', 'pressed'],
        'filter-popover': ['open'],
        'filter-menu': ['open'],
        'filter-actions': [],
    },
    TablePaginator: {
        root: [],
        range: [],
        info: [],
    },
    Toaster: {
        region: [],
        toast: ['loading', 'busy'],
        icon: [],
        content: ['loading', 'busy'],
        title: [],
        description: [],
        close: [],
        action: [],
    },
    EventsView: {
        timeline: [],
        event: ['selected'],
        separator: [],
        marker: ['selected'],
        connector: [],
        content: [],
    },
    ChatSidebar: {
        backdrop: ['selected', 'open'],
        root: ['selected', 'open'],
        header: [],
        back: [],
        title: [],
        close: [],
        content: [],
    },
    Toolbar: {
        root: [],
    },
    ToolbarButton: {
        button: ['selected'],
        icon: [],
        label: [],
    },
    ToolbarFolder: {
        'toolbar-folder': ['open'],
        'toolbar-folder-trigger': ['open'],
        'toolbar-folder-panel': ['open'],
    },
    ToolbarFanOutItem: {
        'fanout-root': ['open'],
        'fanout-trigger': ['open'],
        'fanout-panel': ['open'],
    },
    ToolbarSeparator: {
        'toolbar-separator': [],
    },
    ToolbarSection: {
        'toolbar-section': [],
        'toolbar-context': ['selected'],
    },
    ToolbarGroup: {
        'toolbar-group': [],
        'toolbar-slot': [],
        'toolbar-slot-incoming': [],
        'toolbar-slot-outgoing': [],
    },
    ToolbarLayout: {
        'toolbar-layout': [],
        'toolbar-slot': [],
        'toolbar-slot-incoming': [],
        'toolbar-slot-outgoing': [],
    },
    Skeleton: {
        root: [],
    },
    Message: {
        root: [],
        icon: [],
        text: [],
    },
    Badge: {
        root: [],
    },
    ProgressSpinner: {
        root: ['loading', 'busy'],
        svg: [],
        track: [],
        range: [],
    },
    Avatar: {
        root: [],
        image: [],
        fallback: [],
    },
    Tag: {
        root: [],
        icon: [],
        label: [],
    },
    ProgressBar: {
        root: ['loading', 'busy'],
        indicator: [],
        label: [],
    },
    Chip: {
        root: [],
        icon: [],
        label: [],
        remove: [],
    },
};

/**
 * Render callbacks that receive a documented part marker through spread props while
 * adding canonical states on the returned native element. The spread expression and
 * state set are exact so verifier drift fails closed.
 */
export const splitPartStateAllowlist = [
    {
        file: 'Common/DatePickerInputImplementation.tsx',
        spread: 'groupProps',
        part: 'group',
        states: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
    },
    {
        file: 'Common/DatePickerInputImplementation.tsx',
        spread: 'inputProps',
        part: 'input',
        states: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
    },
    {
        file: 'Common/DatePickerInputImplementation.tsx',
        spread: 'segmentProps',
        part: 'segment',
        states: ['disabled', 'invalid', 'readonly'],
    },
    {
        file: 'Common/DatePickerInputImplementation.tsx',
        spread: 'triggerProps',
        part: 'trigger',
        states: ['disabled', 'selected', 'open', 'invalid', 'readonly'],
    },
    {
        file: 'Dropdown/DropdownImplementation.tsx',
        spread: 'props',
        part: 'trigger',
        states: ['open'],
    },
];

/**
 * Canonical states supplied by owned React Aria primitives at runtime rather than
 * authored as literal JSX attributes. Focused behavior specs prove these exact contracts.
 */
export const implicitPartStateAllowlist = [
    {
        component: 'DatePickerInput',
        file: 'Common/DatePickerInputImplementation.tsx',
        part: 'cell',
        states: ['selected'],
        reason: 'React Aria CalendarCell emits data-selected for the selected date.',
    },
    {
        component: 'ColumnFilterMenu',
        file: 'DataTables/ColumnFilterMenu.tsx',
        part: 'filter-trigger',
        states: ['pressed'],
        reason: 'React Aria Button emits data-pressed during pointer activation.',
    },
];

/** Exact dynamic production expressions that intentionally emit known parts. */
export const dynamicPartExpressions = [
    {
        file: 'Dialogs/DialogImplementation.tsx',
        expression: "primary ? 'confirm' : 'cancel'",
        parts: ['confirm', 'cancel'],
    },
    {
        file: 'Common/TooltipImplementation.tsx',
        expression: "children.props['data-cratis-part'] ?? 'trigger'",
        parts: ['trigger'],
        preservesChildPart: true,
    },
];

/** Exact dynamic test selectors and the concrete values supplied by their fixtures. */
export const dynamicTestSelectors = [
    {
        file: 'Toolbar/for_ToolbarComposition/when_rendering_stable_parts.tsx',
        expression: 'data-cratis-part="${part}"',
        parts: [
            'toolbar-group',
            'toolbar-separator',
            'toolbar-layout',
            'toolbar-slot',
            'toolbar-slot-incoming',
            'toolbar-section',
            'toolbar-context',
            'toolbar-folder',
            'toolbar-folder-trigger',
            'toolbar-folder-panel',
        ],
    },
    {
        file: 'Toolbar/for_ToolbarPanels/when_escape_is_pressed.tsx',
        expression: '[data-cratis-part="${triggerPart}"]',
        parts: ['toolbar-folder-trigger', 'fanout-trigger'],
    },
    {
        file: 'Toolbar/for_ToolbarPanels/when_escape_is_pressed.tsx',
        expression: '[data-cratis-part="${panelPart}"]',
        parts: ['toolbar-folder-panel', 'fanout-panel'],
    },
];

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(sourceRoot, 'types', 'parts.ts');

export const resolveDefinition = (component, seen = new Set()) => {
    const definition = partDefinitions[component];
    if (!definition) throw new Error(`Unknown parts component '${component}'.`);
    if (!definition.aliasOf) return definition;
    if (seen.has(component)) throw new Error(`Circular parts alias at '${component}'.`);
    return resolveDefinition(definition.aliasOf, new Set(seen).add(component));
};

export const resolvedParts = (component) => [...resolveDefinition(component).parts];
export const resolvedPtKeys = (component) => [
    ...(resolveDefinition(component).ptKeys ?? []),
];

export const resolvePartStateDefinition = (component, seen = new Set()) => {
    const definition = partDefinitions[component];
    if (!definition) throw new Error(`Unknown parts component '${component}'.`);
    if (!definition.aliasOf) return partStateDefinitions[component];
    if (seen.has(component))
        throw new Error(`Circular parts-state alias at '${component}'.`);
    return resolvePartStateDefinition(definition.aliasOf, new Set(seen).add(component));
};

export const resolvedPartStates = (component) => {
    const states = resolvePartStateDefinition(component);
    if (!states) throw new Error(`Missing parts-state definition for '${component}'.`);
    return Object.fromEntries(
        resolvedParts(component).map((part) => [part, [...(states[part] ?? [])]]),
    );
};

export function generatedPartsSource() {
    const entries = Object.keys(partDefinitions)
        .map((component) => {
            const parts = resolvedParts(component)
                .map((part) => `'${part}'`)
                .join(', ');
            return `    ${component}: [${parts}],`;
        })
        .join('\n');
    const stateNames = canonicalPartStateNames.map((state) => `'${state}'`).join(', ');
    const stateEntries = Object.keys(partDefinitions)
        .map((component) => {
            const parts = Object.entries(resolvedPartStates(component))
                .map(([part, states]) => {
                    const values = states.map((state) => `'${state}'`).join(', ');
                    return `        '${part}': [${values}],`;
                })
                .join('\n');
            return `    ${component}: {\n${parts}\n    },`;
        })
        .join('\n');

    return `// Copyright (c) Cratis. All rights reserved.\n// Licensed under the MIT license. See LICENSE file in the project root for full license information.\n\n// @generated by Cratis — do not edit\n\n/** Stable data-cratis-part names exposed by each public component. */\nexport const cratisParts = {\n${entries}\n} as const;\n\n/** The canonical Components part-name manifest. */\nexport type CratisPartsManifest = typeof cratisParts;\n\n/** Stable part names exposed by one component in the canonical manifest. */\nexport type PartsOf<K extends keyof CratisPartsManifest> = CratisPartsManifest[K][number];\n\n/** Canonical semantic state names supported by the stable-parts contract. */\nexport const cratisCanonicalPartStates = [${stateNames}] as const;\n\n/** A canonical semantic state name without the data- prefix. */\nexport type CratisCanonicalPartState = (typeof cratisCanonicalPartStates)[number];\n\n/**\n * Canonical states emitted by every stable part. Empty arrays document parts that\n * intentionally expose no canonical state attributes.\n */\nexport const cratisPartStates = {\n${stateEntries}\n} as const satisfies {\n    readonly [Component in keyof CratisPartsManifest]: {\n        readonly [Part in PartsOf<Component>]: readonly CratisCanonicalPartState[];\n    };\n};\n\n/** The canonical component/part/state manifest. */\nexport type CratisPartStatesManifest = typeof cratisPartStates;\n\n/** Canonical states exposed by one stable component part. */\nexport type PartStatesOf<\n    Component extends keyof CratisPartStatesManifest,\n    Part extends keyof CratisPartStatesManifest[Component],\n> = CratisPartStatesManifest[Component][Part] extends readonly (infer State)[]\n    ? State\n    : never;\n`;
}

export function generateParts() {
    writeFileSync(outputPath, generatedPartsSource(), 'utf8');
    return outputPath;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
    const generatedPath = generateParts();
    const componentCount = Object.keys(partDefinitions).length;
    const partCount = Object.keys(partDefinitions).reduce(
        (count, component) => count + resolvedParts(component).length,
        0,
    );
    console.log(
        `Generated ${path.relative(sourceRoot, generatedPath)} with ${componentCount} components and ${partCount} component parts.`,
    );
}

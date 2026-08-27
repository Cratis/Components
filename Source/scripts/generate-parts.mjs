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
        parts: ['root', 'value', 'filter', 'trigger', 'clear', 'popover', 'listbox', 'option', 'multiple', 'indicator'],
        sources: ['Dropdown/Dropdown.tsx'],
        ptKeys: ['root', 'input', 'select', 'trigger', 'value', 'clear', 'indicator', 'popover', 'listbox', 'option', 'filter', 'multiple'],
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
        parts: ['root', 'group', 'input', 'segment', 'placeholder', 'trigger', 'popover', 'dialog', 'calendar', 'header', 'previous', 'heading', 'next', 'grid', 'cell', 'button-bar', 'today', 'clear'],
        sources: ['Common/DatePickerInput.tsx'],
        ptKeys: ['root', 'group', 'input', 'placeholder', 'segment', 'trigger', 'popover', 'dialog', 'calendar', 'header', 'heading', 'previous', 'next', 'grid', 'cell', 'buttonBar', 'today', 'clear'],
    },
    CalendarField: {
        aliasOf: 'DatePickerInput',
        sources: ['CommandForm/fields/CalendarField.tsx'],
    },
    Button: {
        parts: ['root', 'spinner', 'icon', 'label'],
        sources: ['Common/Button.tsx'],
        ptKeys: ['root', 'icon', 'label', 'spinner'],
    },
    ActionMenubar: {
        aliasOf: 'Button',
        sources: ['Common/ActionMenubar.tsx'],
    },
    Tooltip: {
        parts: ['trigger', 'popup'],
        sources: ['Common/Tooltip.tsx'],
    },
    Dialog: {
        parts: ['backdrop', 'positioner', 'root', 'header', 'title', 'close', 'content', 'busy-scope', 'footer', 'confirm', 'cancel'],
        sources: ['Dialogs/Dialog.tsx'],
        ptKeys: ['backdrop', 'positioner', 'root', 'header', 'title', 'close', 'content', 'footer', 'confirm', 'cancel'],
    },
    CommandDialog: {
        aliasOf: 'Dialog',
        sources: ['CommandDialog/CommandDialog.tsx'],
    },
    CommandStepper: {
        parts: ['root', 'list', 'step', 'header', 'number', 'title', 'separator', 'panels', 'panel'],
        sources: ['CommandDialog/CommandStepperContent.tsx'],
        ptFiles: ['CommandDialog/CommandStepper.tsx'],
        ptKeys: ['root', 'list', 'step', 'header', 'number', 'title', 'separator', 'panels', 'panel'],
    },
    DataTableCore: {
        parts: ['root', 'search', 'search-input', 'table-container', 'table', 'head', 'header-row', 'header-cell', 'header-content', 'sort', 'body', 'empty-row', 'empty-cell', 'row', 'cell'],
        sources: ['DataTables/DataTableCore.tsx'],
        ptKeys: ['root', 'search', 'searchInput', 'tableContainer', 'table', 'head', 'headerRow', 'headerCell', 'body', 'row', 'cell', 'emptyRow', 'emptyCell'],
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
        ptKeys: ['trigger', 'popover', 'menu', 'matchMode', 'input', 'actions', 'clear', 'apply'],
    },
    TablePaginator: {
        parts: ['root', 'range', 'info'],
        sources: ['DataTables/TablePaginator.tsx'],
        ptKeys: ['root', 'range', 'info', 'first', 'previous', 'next', 'last'],
    },
    Toaster: {
        parts: ['region', 'toast', 'icon', 'content', 'title', 'description', 'close', 'action'],
        sources: ['Notifications/Toaster.tsx'],
        ptKeys: ['region', 'toast', 'icon', 'content', 'title', 'description', 'close', 'action'],
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
        parts: ['toolbar-group', 'toolbar-slot', 'toolbar-slot-incoming', 'toolbar-slot-outgoing'],
        sources: ['Toolbar/ToolbarGroup.tsx'],
        ptKeys: ['root', 'slot', 'incoming', 'outgoing'],
    },
    ToolbarLayout: {
        parts: ['toolbar-layout', 'toolbar-slot', 'toolbar-slot-incoming', 'toolbar-slot-outgoing'],
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
        sources: ['Display/ProgressBar.tsx'],
    },
    Chip: {
        parts: ['root', 'icon', 'label', 'remove'],
        sources: ['Display/Chip.tsx'],
    },
};

/** Exact dynamic production expressions that intentionally emit known parts. */
export const dynamicPartExpressions = [
    {
        file: 'Dialogs/Dialog.tsx',
        expression: "primary ? 'confirm' : 'cancel'",
        parts: ['confirm', 'cancel'],
    },
    {
        file: 'Common/Tooltip.tsx',
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
export const resolvedPtKeys = (component) => [...(resolveDefinition(component).ptKeys ?? [])];

export function generatedPartsSource() {
    const entries = Object.keys(partDefinitions)
        .map((component) => {
            const parts = resolvedParts(component)
                .map((part) => `'${part}'`)
                .join(', ');
            return `    ${component}: [${parts}],`;
        })
        .join('\n');

    return `// Copyright (c) Cratis. All rights reserved.\n// Licensed under the MIT license. See LICENSE file in the project root for full license information.\n\n// @generated by Cratis — do not edit\n\n/** Stable data-cratis-part names exposed by each public component. */\nexport const cratisParts = {\n${entries}\n} as const;\n\n/** The canonical Components part-name manifest. */\nexport type CratisPartsManifest = typeof cratisParts;\n\n/** Stable part names exposed by one component in the canonical manifest. */\nexport type PartsOf<K extends keyof CratisPartsManifest> = CratisPartsManifest[K][number];\n`;
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

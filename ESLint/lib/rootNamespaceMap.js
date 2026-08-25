// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Single source of truth for `no-root-barrel-import`'s namespace-aware behavior: every
 * namespace currently re-exported from the `@cratis/components` package root, and the
 * small set of setup symbols that remain supported at the root.
 *
 * Mirrors `Source/index.ts` and the `exports` map in `Source/package.json`. When a
 * namespace subpath is added, renamed, or removed there, update `namespaceSubpaths` here
 * (and the matching copy in `Codemods/lib/namespaceMap.js`) in the same change. Neither
 * file imports the other: this plugin and the codemods package ship and publish
 * independently, so the map is intentionally duplicated rather than shared across a
 * workspace boundary.
 */

/**
 * Every namespace name importable from the package root today, mapped to the subpath it
 * belongs to: importing `Canvas` from the root should instead be
 * `import * as Canvas from '@cratis/components/Canvas'`. `Types` is the one case where the
 * namespace name and its subpath differ in casing (`./types`, lowercase).
 */
export const namespaceSubpaths = {
    Canvas: 'Canvas',
    CommandDialog: 'CommandDialog',
    // The former root CommandStepper namespace aliased the entire CommandDialog module.
    // Preserve that module identity; the narrower ./CommandStepper subpath does not.
    CommandStepper: 'CommandDialog',
    CommandForm: 'CommandForm',
    Common: 'Common',
    DataPage: 'DataPage',
    DataTables: 'DataTables',
    Dialogs: 'Dialogs',
    Display: 'Display',
    Dropdown: 'Dropdown',
    Filter: 'Filter',
    Notifications: 'Notifications',
    ObjectContentEditor: 'ObjectContentEditor',
    ObjectNavigationalBar: 'ObjectNavigationalBar',
    PivotViewer: 'PivotViewer',
    SchemaEditor: 'SchemaEditor',
    TimeMachine: 'TimeMachine',
    Toolbar: 'Toolbar',
    Types: 'types',
};

/**
 * The primary setup surface `Source/index.ts` re-exports directly from the root so a
 * consumer that only wants provider setup does not need to know about the `Common`
 * subpath. Importing one of these from the package root is allowed.
 */
export const approvedRootSymbols = new Set([
    'CratisComponentsProvider',
    'useCratisComponentsConfig',
    'cratisDefaults',
    'mergeCratisComponentsConfig',
    'CratisComponentsConfig',
    'CratisComponentsProviderProps',
    'CratisComponentsMessages',
    'CratisPaginatorMessages',
    'CratisDatePickerMessages',
    'CratisDropdownMessages',
    'CratisDialogMessages',
    'CratisStepperMessages',
    'CratisNotificationsMessages',
    'CratisDataTableMessages',
    'CratisColumnFilterMessages',
]);

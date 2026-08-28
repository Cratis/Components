// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Single source of truth for `no-root-barrel-import`'s namespace-aware behavior: every
 * component namespace removed from the Components 3 root, and the small setup surface
 * that remains supported at the Components 4 root.
 *
 * Mirrors `Source/index.ts` and the `exports` map in `Source/package.json`. When a
 * namespace subpath is added, renamed, or removed there, update `namespaceSubpaths` here
 * (and the matching copy in `Codemods/lib/namespaceMap.js`) in the same change. Neither
 * file imports the other: this plugin and the codemods package ship and publish
 * independently, so the map is intentionally duplicated rather than shared across a
 * workspace boundary.
 */

/**
 * Every retained namespace removed from the Components 3 root, mapped to the Components 4
 * subpath it belongs to: importing `Canvas` from the root should instead be
 * `import * as Canvas from '@cratis/components/Canvas'`. `Types` is the one case where the
 * namespace name and its subpath differ in casing (`./types`, lowercase).
 */
export const namespaceSubpaths = {
    Canvas: 'Canvas',
    Chat: 'Chat',
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

/** Components 3 renderer-compatibility exports removed without a Components 4 subpath. */
export const removedRootSymbols = new Set([
    'Compatibility',
    'assertPrimeReact11PassThroughCompatibility',
    'components3PrimeReact11PassThroughContract',
    'primeReact11PassThroughSentinelAttribute',
    'primeReact11PassThroughSentinelPreset',
    'PrimeReact11PassThroughComponent',
]);

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

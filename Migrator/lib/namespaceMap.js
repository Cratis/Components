// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Single source of truth for the root-namespace-removal migration: every component
 * namespace removed from the Components 3 package root, and the small setup surface
 * that remains supported at the Components 4 root.
 *
 * Mirrors `Source/index.ts` and the `exports` map in `Source/package.json`. When a
 * namespace subpath is added, renamed, or removed there, update `namespaceSubpaths`
 * here (and the matching copy in `ESLint/lib/rootNamespaceMap.js`) in the same change.
 * Neither file imports the other: this package and `@cratis/eslint-plugin-components`
 * ship and publish independently, so the map is intentionally duplicated rather than
 * shared across a workspace boundary.
 */

/** The package this migration applies to by default. */
export const packageName = '@cratis/components';

/**
 * Every retained namespace removed from the Components 3 root, mapped to the Components 4
 * subpath it becomes: `import { Canvas } from '@cratis/components'` migrates to
 * `import * as Canvas from '@cratis/components/Canvas'`. `Types` is the one case where
 * the namespace name and its subpath differ in casing (`./types`, lowercase).
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

/**
 * Components 3 root exports that have no Components 4 root or subpath equivalent.
 * These are known migration boundaries rather than unknown symbols: transforms must
 * refuse them with actionable renderer-removal guidance instead of suggesting that the
 * namespace map is incomplete.
 */
export const removedRootSymbols = new Set([
    'Compatibility',
    'assertPrimeReact11PassThroughCompatibility',
    'components3PrimeReact11PassThroughContract',
    'primeReact11PassThroughSentinelAttribute',
    'primeReact11PassThroughSentinelPreset',
    'PrimeReact11PassThroughComponent',
]);

/**
 * The primary setup surface Source/index.ts re-exports directly from the root so a
 * consumer that only wants provider setup does not need to know about the `Common`
 * subpath. These names are never rewritten to a namespace import.
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

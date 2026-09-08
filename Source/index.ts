// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The package root is a setup-only surface: it carries the application-wide
 * {@link CratisComponentsProvider} and its configuration contract - locale,
 * messages, and the hook/merge helpers that read and build that configuration
 * - and nothing else. Every component, part type, and utility lives behind its
 * own explicit subpath (`@cratis/components/Canvas`, `@cratis/components/CommandDialog`,
 * `@cratis/components/DataPage`, ...); the root barrel intentionally does not
 * re-export those namespaces.
 *
 * This keeps a consumer's root import free of every optional-peer-heavy subsystem
 * (Canvas and PivotViewer's Pixi dependency chief among them) and free of every
 * `@cratis/arc`/`@cratis/arc.react` runtime or declaration edge. Importing the root
 * therefore does not resolve or type-check Pixi or Arc modules; package-level peer metadata
 * still describes the requirements of the complete set of optional capability subpaths.
 * Import a component from its subpath; import the provider and its configuration
 * types from here.
 */
export {
    CratisComponentsProvider,
    useCratisComponentsConfig,
    cratisDefaults,
    mergeCratisComponentsConfig,
    type CratisComponentsConfig,
    type CratisComponentsProviderProps,
    type CratisComponentsMessages,
    type CratisPaginatorMessages,
    type CratisDatePickerMessages,
    type CratisDropdownMessages,
    type CratisDialogMessages,
    type CratisStepperMessages,
    type CratisNotificationsMessages,
    type CratisDataTableMessages,
    type CratisColumnFilterMessages,
} from './Common/CratisComponentsProvider';

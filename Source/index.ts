// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Namespace re-exports below are an intentional, documented contract: every
 * subpath in `Source/package.json`'s `exports` map (`@cratis/components/Canvas`,
 * `@cratis/components/CommandDialog`, ...) is also reachable as a namespace off
 * the package root (`import { Canvas } from '@cratis/components'`), so a consumer
 * that only wants the root import does not have to know the subpath layout.
 * Each namespace's own members carry their own TSDoc; the summaries here describe
 * what each subsystem is for.
 */

/** Pan/zoom/Pixi-backed world surface, including the Chat, Note, and Region shapes. */
import * as Canvas from './Canvas';
/** Modal command dialogs, including the multi-step {@link StepperCommandDialog}. */
import * as CommandDialog from './CommandDialog';
/** Alias of {@link CommandDialog} kept for the standalone `./CommandStepper` subpath - same module, same members. */
import * as CommandStepper from './CommandDialog';
/** Field components and the field-type provider registry bound to Arc command forms. */
import * as CommandForm from './CommandForm';
/** Cross-cutting primitives: the provider, buttons, icons, tooltips, and page chrome. */
import * as Common from './Common';
/** The `DataPage` list/detail composition shell and its `Column` marker. */
import * as DataPage from './DataPage';
/** Query-backed and observable-query-backed data tables, columns, and filter matchers. */
import * as DataTables from './DataTables';
/** The base `Dialog` primitive plus busy-indicator and confirmation dialogs. */
import * as Dialogs from './Dialogs';
/** Small presentational primitives: tags, badges, chips, avatars, and progress indicators. */
import * as Display from './Display';
/** The accessible single/multi-select `Dropdown` control. */
import * as Dropdown from './Dropdown';
/** The filter panel, range histogram filter, and `useFilterState` state hook. */
import * as Filter from './Filter';
/** The app-wide imperative toast queue and `Toaster` region. */
import * as Notifications from './Notifications';
/** The structured JSON/JSON-Schema content editor. */
import * as ObjectContentEditor from './ObjectContentEditor';
/** The breadcrumb-style navigational bar for a navigable object path. */
import * as ObjectNavigationalBar from './ObjectNavigationalBar';
/** The faceted, zoomable card-grid `PivotViewer` visualization. */
import * as PivotViewer from './PivotViewer';
/** The JSON Schema-driven object editor. */
import * as SchemaEditor from './SchemaEditor';
/** The version-scrubbing `TimeMachine`, its read-model and events views, and `Properties` table. */
import * as TimeMachine from './TimeMachine';
/** The composable canvas-style icon toolbar and its part family. */
import * as Toolbar from './Toolbar';
/** Cross-cutting JSON/JSON-Schema/navigation types shared across editors. */
import * as Types from './types';

export {
    Canvas,
    CommandDialog,
    CommandStepper,
    CommandForm,
    Common,
    DataPage,
    DataTables,
    Dialogs,
    Display,
    Dropdown,
    Filter,
    Notifications,
    ObjectContentEditor,
    ObjectNavigationalBar,
    PivotViewer,
    SchemaEditor,
    TimeMachine,
    Toolbar,
    Types,
};

// Re-export the primary setup surface from the root so the recommended
// `import { CratisComponentsProvider } from '@cratis/components'` works
// without consumers having to know about the `Common` subpath.
export {
    CratisComponentsProvider,
    cratisDefaults,
    mergeCratisComponentsConfig,
    type CratisComponentsConfig,
    type CratisComponentsProviderProps,
} from './Common/CratisComponentsProvider';

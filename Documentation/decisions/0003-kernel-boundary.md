---
title: Repository-owned kernel boundary
description: The explicit React-free and browser-DOM-free computation kernel enforced in Components source and emitted package graphs.
sidebar:
    order: 3
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

## Context

Components intentionally exposes React and browser DOM contracts at its public component surface. That does not make React or the DOM appropriate dependencies for every internal computation. Layout, filtering, selection, coercion, schema paths, and conversation transforms are easier to test and reuse when they remain plain TypeScript.

A folder name cannot establish this boundary. Components has mixed directories where a pure helper sits next to React components, browser focus behavior, pointer normalization, animation-frame scheduling, Web Workers, or Pixi rendering. Classifying a whole mixed folder would either reject valid UI code or quietly allow kernel code to acquire UI dependencies.

The boundary therefore needs a repository-owned inventory of verified modules, a source rule, and an emitted-graph assertion that follows each module's transitive runtime and declaration dependencies.

## Decision

Components maintains one canonical kernel inventory in `ESLint/lib/kernelBoundary.js`. The root ESLint config enables `@cratis/components/no-react-in-kernel` only for those paths. The package-graph gate derives emitted `.js` and `.d.ts` entries from the same inventory and walks both closures.

A declared kernel module must not:

- import, require, dynamically import, or re-export `react`, `react-dom`, `react-aria-components`, or any subpath of those packages;
- reference browser DOM globals, including DOM element/event types and browser runtime services;
- reach one of those package dependencies through its emitted runtime or declaration closure; or
- reach a browser DOM global through its emitted runtime or declaration closure.

This boundary is separate from the existing Pixi, renderer-vendor, renderer export, and private `renderer/coreSlots` package-graph assertions. Those rules remain unchanged.

## Included modules

The accepted kernel inventory is exact. A directory not listed here is not implicitly included.

### PivotViewer engine

- `Source/PivotViewer/constants.ts`
- `Source/PivotViewer/engine/layout.ts`
- `Source/PivotViewer/engine/requestCorrelator.ts`
- `Source/PivotViewer/engine/store.ts`
- `Source/PivotViewer/engine/types.ts`

### Canvas computation

- `Source/Canvas/canvasGesture.ts`
- `Source/Canvas/canvasTransformActivity.ts`
- `Source/Canvas/panMomentum.ts`
- `Source/Canvas/pinchGesture.ts`
- `Source/Canvas/shapes/Region/regionContainment.ts`

### Filter state and histogram computation

- `Source/Filter/types.ts`
- `Source/Filter/utils.ts`

### DataTables paging, filtering, and selection

- `Source/DataTables/DataTableFilterMatcherRegistry.ts`
- `Source/DataTables/DataTableFilterMeta.ts`
- `Source/DataTables/paginatorRange.ts`
- `Source/DataTables/selectionKeys.ts`

### Command transforms and value mapping

- `Source/CommandDialog/applyBeforeExecute.ts`
- `Source/CommandForm/commandFormMarkers.ts`
- `Source/CommandForm/fields/chipValues.ts`
- `Source/CommandForm/fields/fieldValueFromEvent.ts`

### Schema paths and validation

- `Source/SchemaEditor/schemaHelpers.ts`

### Chat reducers and mention segmentation

- `Source/Chat/isTopicUnnamed.ts`
- `Source/Chat/shouldRequestTopicName.ts`
- `Source/Chat/topicsByActivity.ts`
- `Source/Chat/Kit/findOwnReaction.ts`
- `Source/Chat/Kit/reactionsExcludingUser.ts`
- `Source/Chat/Kit/Mentions/MentionCandidate.ts`
- `Source/Chat/Kit/Mentions/MentionQuery.ts`
- `Source/Chat/Kit/Mentions/activeMentionQuery.ts`
- `Source/Chat/Kit/Mentions/applyMention.ts`
- `Source/Chat/Kit/Mentions/extractMentions.ts`
- `Source/Chat/Kit/Mentions/findMentionRanges.ts`
- `Source/Chat/Kit/Mentions/matchCandidates.ts`
- `Source/Chat/Kit/Mentions/mentionSegments.ts`

## Explicit exclusions

The initial inventory deliberately excludes candidates that are not React-free and DOM-free today:

- `Source/PivotViewer/engine/pivot.worker.ts` uses the Web Worker `self` and message-event runtime. PivotViewer components, hooks, Pixi sprite/animation code, and environment observers remain outside the kernel.
- Canvas focus and selection guards, pointer-target and scrollable-content normalization, `zoomMechanism.ts`, `selfSuspendingFrameLoop.ts`, `noteFont.ts`, every React hook, every TSX component, and Pixi-backed code remain outside. `Canvas/*.ts` is not a safe folder-wide pattern.
- `Source/Filter/useFilterState.ts` is a React hook. `FilterEditorProps.ts` carries the DOM-aware public `ChangeHandler` metadata contract. Filter editors and histogram UI components remain outside; only their state and histogram computations are included.
- `Source/DataTables/DataTableSelectionChangeEvent.ts` carries React's `SyntheticEvent`. Table components, keyboard/focus behavior, and renderer adapters remain outside.
- `Source/CommandDialog/stepChildren.ts` uses React's runtime child traversal. Dialog, stepper, focus, portal, and component modules remain outside.
- `Source/CommandForm/FieldTypeProvider.ts` exposes React `ComponentType`, so `fieldTypeProviderRegistry.ts` reaches React through its declaration closure. Default providers and every field component also remain outside. The initial inventory includes only marker, coercion, and validation-mapping helpers with clean closures.
- Notifications are not included. `toast.ts` exposes React nodes and browser button types, while timeout scheduling lives in `Toaster.tsx`; there is no independent React-free queue contract behind an existing clock boundary to declare yet.
- SchemaEditor React cells and editor composition remain outside; only `schemaHelpers.ts` is included.
- Chat components, hooks, anchored overlays, focus/portal behavior, and React-valued action descriptors remain outside. `FailedReply` is a React component and the current source has no independent pure retry reducer to declare.

An excluded module receives no broad allowlist. It can enter the inventory only after its dependency closure is genuinely clean, using a type-only dependency or an explicit port at the UI boundary without changing behavior.

## Ratchet policy

The inventory is **grow-never-shrink**. New verified computation modules should be added. An existing entry must not be removed merely to make a new React or DOM dependency pass. Extract the dependency behind a UI-owned port or keep the new behavior outside the kernel.

A source rename or deletion may update the literal path, but it must preserve or increase the protected architectural surface. Any exceptional reduction requires a superseding architecture decision that explains why the module is no longer kernel code; a routine lint suppression or package-graph allowlist is not acceptable.

## Consequences

Kernel computations receive an immediate source diagnostic when React or browser behavior crosses the boundary. The packed plugin carries the same rule implementation, while the Components root config owns activation and scope.

The package graph catches transitive and declaration-only React and browser-DOM edges that a direct-import rule cannot see. It checks both emitted runtime references and declaration types, so compilation or bundling cannot silently introduce a platform dependency.

Mixed folders remain mixed. This decision creates no source moves, renderer facades, component behavior changes, or consumer contract changes. The inventory records only boundaries the current source already satisfies.

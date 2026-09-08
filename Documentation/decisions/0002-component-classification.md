---
title: Public component classification
description: The architecture categories assigned to every component exported by the public package barrels.
sidebar:
    order: 2
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

## Context

Components needs an architecture vocabulary that says what kind of ownership each public component requires. Capability profiles such as Foundation, Advanced React, and Spatial answer a different question: they group subpaths by adoption shape and dependencies. They do not determine whether a component is a leaf, owns interaction behavior, coordinates a larger workflow, or exists only as an adapter.

Without a separate classification, a high-order composition can be mistaken for a replaceable renderer slot, while an element-bounded primitive can inherit unnecessary framework policy. The classification must cover every React component exported by the package's current public barrels exactly once.

## Decision

Every public component belongs to exactly one of these architecture categories:

- **Visual primitive** — an element-bounded or static leaf. It owns Components markup and styling but does not coordinate a larger workflow or reusable interaction system. Native element behavior does not by itself make a visual primitive an interaction primitive.
- **Interaction primitive** — a reusable surface that owns interaction behavior such as overlays, focus, keyboard navigation, selection, picking, or range manipulation. `Dialog`, `Dropdown`, `DatePickerInput`, and `Tooltip` are representative behavior owners.
- **Arc/high-order composite** — an Arc-bound component or a larger composition that coordinates data, state, children, contexts, slots, commands, queries, or several primitives. Declarative marker and provider components belong with the composite whose contract they configure.
- **Interop-only** — a component whose sole public purpose is translating between Components and an external renderer or framework contract. It owns no independent Components interaction or workflow contract. This category is empty today; using Pixi internally or delegating behavior to React Aria does not make a component interop-only.

The permanent non-slot composite boundaries are DataTables, Canvas, PivotViewer, SchemaEditor, TimeMachine, Toolbar, ObjectContentEditor, CommandDialog, CommandForm, Notifications, and Chat, together with repository-grounded peers DataPage and ObjectNavigationalBar. Their roots and contract-specific composition pieces remain Components-owned high-order contracts rather than renderer slots.

This classification is intentionally independent of the Foundation, Advanced React, and Spatial capability profiles.

## Public component inventory

The inventory follows the setup root and every JavaScript component subpath in `Source/package.json`, including transitive exports from their public barrels. A symbol re-exported by more than one subpath appears once and names both paths.

| Public subpath | Component | Classification |
| --- | --- | --- |
| `Common` | `ActionMenubar` | interaction primitive |
| `Canvas` | `AnchoredOverlay` | interaction primitive |
| `CommandForm` | `AutoCommandForm` | Arc/high-order composite |
| `Display` | `Avatar` | visual primitive |
| `Display` | `Badge` | visual primitive |
| `Dialogs` | `BusyIndicatorDialog` | Arc/high-order composite |
| `Common` | `Button` | visual primitive |
| `CommandForm` | `CalendarField` | Arc/high-order composite |
| `Canvas` | `Canvas` | Arc/high-order composite |
| `Canvas` | `CanvasControls` | Arc/high-order composite |
| `Canvas` | `CanvasItem` | Arc/high-order composite |
| `Canvas` | `CanvasMinimap` | Arc/high-order composite |
| `Canvas` | `CanvasOverlay` | Arc/high-order composite |
| `Canvas` | `Chat` | Arc/high-order composite |
| `Canvas` | `ChatBubble` | interaction primitive |
| `Canvas` | `ChatComposer` | Arc/high-order composite |
| `Chat` | `ChatConversation` | Arc/high-order composite |
| `Chat` | `ChatMessageBody` | visual primitive |
| `Canvas` | `ChatMessageBubble` | Arc/high-order composite |
| `Chat` | `ChatSidebar` | Arc/high-order composite |
| `Chat` | `ChatSidebarForObservableQueries` | Arc/high-order composite |
| `Chat` | `ChatTopicList` | Arc/high-order composite |
| `Common` | `Checkbox` | visual primitive |
| `CommandForm` | `CheckboxField` | Arc/high-order composite |
| `Display` | `Chip` | visual primitive |
| `CommandForm` | `ChipsField` | Arc/high-order composite |
| `CommandForm` | `ColorPickerField` | Arc/high-order composite |
| `DataTables` and `DataPage` | `Column` | Arc/high-order composite |
| `DataTables` | `ColumnFilterMenu` | Arc/high-order composite |
| `DataPage` | `Columns` | Arc/high-order composite |
| `CommandDialog` | `CommandDialog` | Arc/high-order composite |
| `CommandDialog` and `CommandStepper` | `CommandStepper` | Arc/high-order composite |
| `Dialogs` | `ConfirmationDialog` | Arc/high-order composite |
| `@cratis/components` and `Common` | `CratisComponentsProvider` | Arc/high-order composite |
| `DataTables` | `DataTableCore` | Arc/high-order composite |
| `DataTables` | `DataTableForObservableQuery` | Arc/high-order composite |
| `DataTables` | `DataTableForQuery` | Arc/high-order composite |
| `Common` | `DatePickerInput` | interaction primitive |
| `Dialogs` | `Dialog` | interaction primitive |
| `Dropdown` | `Dropdown` | interaction primitive |
| `CommandForm` | `DropdownField` | Arc/high-order composite |
| `Canvas` | `EmojiPicker` | interaction primitive |
| `Common` | `ErrorBoundary` | Arc/high-order composite |
| `TimeMachine` | `EventsView` | Arc/high-order composite |
| `Canvas` | `FailedReply` | Arc/high-order composite |
| `Filter` | `FilterEditor` | Arc/high-order composite |
| `Filter` | `FilterPanel` | Arc/high-order composite |
| `Common` | `FormElement` | visual primitive |
| `Common` | `IconButton` | visual primitive |
| `Common` | `IconDisplay` | visual primitive |
| `CommandForm` | `InputTextField` | Arc/high-order composite |
| `Canvas` | `MentionSuggestions` | interaction primitive |
| `DataPage` | `MenuItem` | Arc/high-order composite |
| `DataPage` | `MenuItems` | Arc/high-order composite |
| `Display` | `Message` | visual primitive |
| `Canvas` | `MessageReactions` | interaction primitive |
| `CommandForm` | `MultiSelectField` | Arc/high-order composite |
| `Canvas` | `Note` | Arc/high-order composite |
| `CommandForm` | `NumberField` | Arc/high-order composite |
| `ObjectContentEditor` | `ObjectContentEditor` | Arc/high-order composite |
| `ObjectNavigationalBar` | `ObjectNavigationalBar` | Arc/high-order composite |
| `Common` | `Page` | Arc/high-order composite |
| `CommandForm` | `PasswordField` | Arc/high-order composite |
| `Canvas` | `PersonAvatarCircle` | visual primitive |
| `PivotViewer` | `PivotViewer` | Arc/high-order composite |
| `Display` | `ProgressBar` | visual primitive |
| `Display` | `ProgressSpinner` | visual primitive |
| `TimeMachine` | `Properties` | Arc/high-order composite |
| `Common` | `Radio` | visual primitive |
| `CommandForm` | `RadioButtonField` | Arc/high-order composite |
| `CommandForm` | `RadioGroupField` | Arc/high-order composite |
| `Filter` | `RangeHistogramFilter` | interaction primitive |
| `CommandForm` | `RatingField` | Arc/high-order composite |
| `Canvas` | `ReactionPicker` | interaction primitive |
| `TimeMachine` | `ReadModelView` | Arc/high-order composite |
| `Canvas` | `Region` | Arc/high-order composite |
| `SchemaEditor` | `SchemaEditor` | Arc/high-order composite |
| `Display` | `Skeleton` | visual primitive |
| `CommandForm` | `SliderField` | Arc/high-order composite |
| `CommandDialog` | `StepperCommandDialog` | Arc/high-order composite |
| `CommandDialog` | `StepperPanel` | Arc/high-order composite |
| `Common` | `Surface` | visual primitive |
| `Common` | `Switch` | visual primitive |
| `DataTables` | `TablePaginator` | Arc/high-order composite |
| `Display` | `Tag` | visual primitive |
| `Common` | `TextArea` | visual primitive |
| `CommandForm` | `TextAreaField` | Arc/high-order composite |
| `Common` | `TextInput` | visual primitive |
| `TimeMachine` | `TimeMachine` | Arc/high-order composite |
| `Notifications` | `Toaster` | Arc/high-order composite |
| `CommandForm` | `ToggleSwitchField` | Arc/high-order composite |
| `Toolbar` | `Toolbar` | Arc/high-order composite |
| `Toolbar` | `ToolbarButton` | Arc/high-order composite |
| `Toolbar` | `ToolbarContext` | Arc/high-order composite |
| `Toolbar` | `ToolbarFanOutItem` | Arc/high-order composite |
| `Toolbar` | `ToolbarFolder` | Arc/high-order composite |
| `Toolbar` | `ToolbarGroup` | Arc/high-order composite |
| `Toolbar` | `ToolbarLayout` | Arc/high-order composite |
| `Toolbar` | `ToolbarSection` | Arc/high-order composite |
| `Toolbar` | `ToolbarSeparator` | Arc/high-order composite |
| `Toolbar` | `ToolbarSlot` | Arc/high-order composite |
| `Toolbar` | `ToolbarSlotProvider` | Arc/high-order composite |
| `Common` | `Tooltip` | interaction primitive |
| `Canvas` | `TypingIndicator` | visual primitive |

The accepted inventory contains 21 visual primitives, 12 interaction primitives, 71 Arc/high-order composites, and no interop-only components.

Exported types and interfaces, helpers and hooks, events and messages, enum and configuration values, registries, and React context values are not components and are excluded. Examples include `CanvasItemRegistryContext`, `DialogInitialFocus`, `ChatMessageAdded`, `NoteTextChanged`, `toast`, `useFilterState`, and the `*Props`, event, label, parts, and model types.

## Consequences

Visual and interaction primitives can evolve behind Components-owned markup and types, but classification does not authorize leaking an internal renderer's types or DOM.

High-order composites remain owned compositions. Their declarative markers, providers, table state, Arc bindings, and nested workflow contracts are not treated as generic renderer slots merely because they contain lower-level primitives.

The inventory must change whenever a public barrel adds, removes, or renames a component. A new export must be assigned once; non-component exports remain explicitly outside the inventory.

Classification does not indicate maturity, accessibility conformance, support tier, performance tier, or capability profile.

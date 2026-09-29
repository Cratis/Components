---
title: ActionMenubar
description: Render a horizontal toolbar of page-level command actions.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

`ActionMenubar` renders a flat set of command actions from `@cratis/components/Common`. Use it for page-level actions; use [`Toolbar`](../Toolbar/index.md) for a canvas-style tool palette with active tools, groups, folders, or fan-out panels.

## Basic usage

```tsx
import { ActionMenubar } from '@cratis/components/Common';

<ActionMenubar
    aria-label='Project actions'
    model={[
        { label: 'Create project', command: createProject },
        { label: 'Archive', command: archiveProject, severity: 'warn' },
        { label: 'Delete', command: deleteProject, severity: 'danger', disabled: true },
    ]}
/>;
```

The root is a `div` with `role='toolbar'` and `data-cratis-part='root'`. Pass `aria-label` to set the toolbar's accessible name; there is no default.

## Keyboard navigation

Each action renders as a native ghost `Button`. By default, `focusMode={ToolbarFocusMode.Arrows}` moves between actions with Left/Right (reversed in RTL), and Home/End move to the first/last available action. Navigation follows DOM order, skips disabled, hidden, and inert actions, and does not wrap. Every action remains its own Tab stop, preserving Tab and Shift+Tab behavior.

Import `ToolbarFocusMode` from `@cratis/components/Common`. Set `focusMode={ToolbarFocusMode.SingleTabStop}` to give the menubar's own actions one Tab stop that follows the arrow keys and returns to the last focused action; template content and actions with an explicit `pt.root.tabIndex` keep their own Tab stop. Set `focusMode={ToolbarFocusMode.None}` to disable toolbar key handling while retaining native Tab stops. Widgets in templates keep their own keys. Child handlers and `pt.root.onKeyDown` can prevent navigation. `SingleTabStop` becomes the default in the next major release ([#353](https://github.com/Cratis/Components/issues/353)).

An item's visible `label` is also its accessible name, and `ActionMenuItem` has no separate `aria-label`, so give every item a `label` or use `template` for an icon-only action that names itself.

## `ActionMenuItem`

| Field       | Type                                        | Purpose                                      |
| ----------- | ------------------------------------------- | -------------------------------------------- |
| `label`     | `string`                                    | Visible button label.                        |
| `icon`      | `ReactNode`                                 | Content rendered before the label.           |
| `command`   | `() => void`                                | Invoked when the action is activated.        |
| `disabled`  | `boolean`                                   | Disables the action button.                  |
| `className` | `string`                                    | Extra class name for the action button.      |
| `severity`  | `ButtonSeverity`                            | Maps the action severity to a button tone.   |
| `template`  | `(item: ActionMenuItem) => ReactNode`       | Fully replaces rendering for this menu item. |

When `template` is present, `ActionMenubar` renders its result directly instead of rendering a Components `Button`. The item's `severity`, `disabled`, and `className`, the shared `pt`, and the normal button label, icon, and command wiring therefore do not apply unless the template implements them.

## `ActionMenubarProps`

| Prop         | Type               | Required | Purpose                                                    |
| ------------ | ------------------ | -------- | ---------------------------------------------------------- |
| `model`      | `ActionMenuItem[]` | Yes      | Actions rendered from left to right.                       |
| `focusMode`  | `ToolbarFocusMode` | No      | `Arrows` (default), `SingleTabStop`, or `None`.            |
| `className`  | `string`           | No       | Extra class name for the toolbar root.                     |
| `aria-label` | `string`           | No       | Accessible name for the toolbar.                           |
| `pt`         | `ButtonParts`      | No       | Part attributes applied to every non-template action button. |
| `ptOptions`  | `object`           | No       | Deprecated, retained for source compatibility, and ignored. |
| `unstyled`   | `boolean`          | No       | Deprecated, retained for source compatibility, and ignored. |

`pt` is the [`ButtonParts`](basic-controls.md) surface, not a toolbar-root parts object. It is passed to each `Button` created from the model. Use `className` to identify the `ActionMenubar` root.

## See also

- [DataPage](../DataPage/index.md) — the list-page composition that uses `ActionMenubar` for its action row
- [Toolbar](../Toolbar/index.md) — canvas-style tool palettes
- [Stable component parts](../Styling/pass-through.md) — Components-owned parts and state attributes

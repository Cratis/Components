---
title: Common components
description: Native form controls, pickers, collection controls, layout, icons, and error handling from @cratis/components/Common.
---

The Common module provides reusable UI components and the application provider that serve as building blocks for applications. Import the components from `@cratis/components/Common`:

```tsx
import { Button, ComboBox, Page, TextInput } from '@cratis/components/Common';
```

`CratisComponentsProvider` is also re-exported here, but the conventional import is the package root, `@cratis/components`.

## Components

- **CratisComponentsProvider**: Locale, Components-owned labels and icons, and optional app-wide toaster.
- **TextInput / TextArea**: Native text controls with semantic string changes and real element refs.
- **NumberInput**: Controlled locale-aware numeric entry with nullable values, fractions, bounds, adornments, and explicit commits.
- **ComboBox**: Single-selection entity picker — type to filter, keyboard selection, loading, failure, empty and add-new states.
- **Checkbox / Radio / Switch**: Native form choices with semantic boolean changes and browser-owned submission and reset behavior.
- **Button / IconButton**: Native actions with semantic variants, tones, loading, and disabled behavior.
- **Surface**: A bounded `div`, `section`, or `article` container with no invented interaction state.
- **ToggleGroup / Tabs / TagGroup / Breadcrumbs**: Choosing a value, switching a view, editing a set of values, and showing where you are.
- **ActionMenubar**: A flat row of page-level command actions.
- **Icon / IconDisplay**: Unified icon type that accepts a CSS class string or any React node.
- **Page**: Layout primitive for consistent page structures.
- **FormElement**: Lightweight wrapper that places an icon addon to the left of a form input.
- **ErrorBoundary**: Error handling for React component trees.

The subpath also exports `DatePickerInput` and `Tooltip`. `DatePickerInput` is the control behind [`CalendarField`](../CommandForm/calendar-field.md).

## See Also

- [Basic controls](basic-controls.md) — native form, ref, change, part, and state contracts
- [Locale-aware number input](number-input.md) — locale, nullable edit, commit, adornment, range, part, and token contracts
- [ComboBox](combobox.md) — filtering, not-ready states, the action row, accessibility, part and token contracts
- [Collection controls](collection-controls.md) — `ToggleGroup`, `Tabs`, `TagGroup` and `Breadcrumbs`
- [ActionMenubar](action-menubar.md) — page-level command actions
- [CratisComponentsProvider](cratis-components-provider.md) — locale, labels, icons, and toaster configuration
- [Icon](icon.md) - Icon type and IconDisplay component
- [Page](page.md) - Page layout component
- [FormElement](form-element.md) - Form field icon-addon wrapper
- [ErrorBoundary](error-boundary.md) - Error boundary component
- [Styling Overview](../Styling/index.md) — the supported styling options and how Common fits in

---
title: Common components
description: Choose among the native form controls, pickers, collection controls, layout, icons, and error handling in @cratis/components/Common.
---

The Common subpath holds the building blocks that work with ordinary React state and need no Arc command binding. Import them from `@cratis/components/Common`:

```tsx
import { Button, ComboBox, DatePickerInput, TextInput } from '@cratis/components/Common';
```

`CratisComponentsProvider` is also re-exported here, but the conventional import is the package root, `@cratis/components`. Mount it once at the application root to supply the locale and Components-owned labels; see [CratisComponentsProvider](cratis-components-provider.md).

When the value belongs to an Arc command, use the matching [CommandForm field](../CommandForm/index.md) instead of wiring a Common control to the command yourself.

## Enter a value

| You want to… | Use | Reference |
| --- | --- | --- |
| Enter free text on one or several lines | `TextInput`, `TextArea` | [Basic controls](basic-controls.md) |
| Enter a number with locale separators, fraction rules, bounds, or a nullable value | `NumberInput` | [Locale-aware number input](number-input.md) |
| Enter a date or a date and time | `DatePickerInput` | [DatePickerInput](date-picker-input.md) |
| Put an icon addon in front of your own input | `FormElement` | [FormElement](form-element.md) |

## Choose from options

| You want to… | Use | Reference |
| --- | --- | --- |
| Turn one option on or off | `Checkbox` or `Switch` | [Basic controls](basic-controls.md) |
| Pick one of a few options that are all visible | `Radio`, or `ToggleGroup` for a segmented control | [Basic controls](basic-controls.md), [Collection controls](collection-controls.md) |
| Pick one entity by typing to search, with loading, empty, failure and add-new states | `ComboBox` | [ComboBox](combobox.md) |
| Pick one or more values from a known, small list | `Dropdown` (separate subpath) | [Dropdown](../Dropdown/index.md) |
| Edit a set of values as removable tags | `TagGroup` | [Collection controls](collection-controls.md) |

## Act, navigate, and lay out

| You want to… | Use | Reference |
| --- | --- | --- |
| Run one action | `Button`, or `IconButton` for an icon-only action | [Basic controls](basic-controls.md) |
| Show a row of page-level command actions | `ActionMenubar` | [ActionMenubar](action-menubar.md) |
| Switch between views of the same content | `Tabs` | [Collection controls](collection-controls.md) |
| Show where the user is in a hierarchy | `Breadcrumbs` | [Collection controls](collection-controls.md) |
| Give a routed view a full-height layout and title | `Page` | [Page](page.md) |
| Group content in a bounded `div`, `section`, or `article` | `Surface` | [Basic controls](basic-controls.md) |
| Show a short hint on hover and keyboard focus of one element | `Tooltip` | No reference page yet |

## Icons, configuration, and errors

| You want to… | Use | Reference |
| --- | --- | --- |
| Pass an icon as a React node or icon-font class | `Icon`, `IconDisplay` | [Icon](icon.md) |
| Set the locale, owned labels, icons, or the app-wide toaster | `CratisComponentsProvider` | [CratisComponentsProvider](cratis-components-provider.md) |
| Stop a render failure from taking down the whole screen | `ErrorBoundary` | [ErrorBoundary](error-boundary.md) |

Modal content, confirmations, and busy states are in the separate [Dialogs](../Dialogs/index.md) subpath. For choices that span several subpaths, such as a table versus a data page, see [Choosing a component](../choosing-a-component.md). To restyle any of these controls, start with the [Styling overview](../Styling/index.md).

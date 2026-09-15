---
title: ComboBox
description: Pick one entity by typing to filter, with loading, failure, empty and add-new states, keyboard selection, and stable parts.
---

`ComboBox` is the single-selection, text-searching picker: type to narrow a list of options, move with the arrow keys, pick with Enter. It is for choosing an _entity_ — a customer, a contact, a company — from options that may still be loading, may have failed to load, and may need an "add new" escape hatch.

Use [`Dropdown`](../Dropdown/index.md) for choosing from a known, small set, or several values at once; its `filter` path is a filterable select, not an entity picker.

## Controlled usage

```tsx
import { ComboBox } from '@cratis/components/Common';

const [customerId, setCustomerId] = useState<string | null>(null);

<label htmlFor='customer'>Customer</label>
<ComboBox
    id='customer'
    options={customers.map(customer => ({ key: customer.id, label: customer.name, description: customer.orgNumber }))}
    value={customerId}
    onChange={setCustomerId}
    placeholder='Search customers'
    emptyMessage='No customer matches.'
/>
```

`value` is the selected option's `key` or `null`. Selecting writes the option's label into the input; clearing the text and leaving the field clears the selection. A `value` set from outside shows its label; options that arrive after mount with a key already chosen show its label too, unless the user is typing at that moment.

## Filtering and searching

| `filter`     | Behavior                                                                  |
| ------------ | ------------------------------------------------------------------------- |
| `contains`   | Default. Options whose label contains the typed text, case-insensitively. |
| `startsWith` | Options whose label starts with the typed text.                           |
| `none`       | `options` shown as given — for a consumer that filters or queries itself. |

`onInputChange` receives the text as it is typed, so a consumer can drive a server-side search and feed the result back through `options` with `filter='none'`. `openOnFocus` opens the list when the input receives focus, so a short roster is visible before anything is typed.

## Not-ready states and the action row

- `loading` with `loadingMessage` shows the message instead of options, as a `status` region marked busy.
- `failure` replaces the options with the given content as an `alert`.
- `emptyMessage` shows when nothing matches.
- `action` renders one row after the options — reachable by arrow keys, chosen with Enter or a click — and calls `onAction(inputValue)` with the typed text. The selection is unchanged.

## Accessibility contract

The input carries `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list is a `listbox` of `option`s; a disabled option is `aria-disabled`. ArrowDown/ArrowUp move, Home/End jump, Enter selects, Escape closes, typing filters. Name the control through a visible `<label htmlFor={id}>`, `aria-label` or `aria-labelledby`; `description` and `errorMessage` render under the control and join `aria-describedby`; `errorMessage` also becomes `aria-errormessage` while `invalid`.

## Props

| Prop                                             | Type                                      | Default       | Behavior                                                         |
| ------------------------------------------------ | ----------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `options`                                        | `ComboBoxOption[]`                        | Required      | `key`, `label`, optional `description` and `disabled`.           |
| `value` / `onChange`                             | `string \| null`, `(key) => void`         | Required      | Controlled selected key.                                         |
| `inputValue` / `onInputChange`                   | `string`, `(text) => void`                | Internal      | Controlled or observed input text.                               |
| `filter`                                         | `'contains' \| 'startsWith' \| 'none'`    | `contains`    | How typed text narrows `options`.                                |
| `openOnFocus`                                    | `boolean`                                 | `false`       | Opens the list on focus.                                         |
| `loading` / `loadingMessage`                     | `boolean`, `ReactNode`                    | `false`       | Busy state instead of options.                                   |
| `failure`                                        | `ReactNode`                               | —             | Alert content replacing the options.                             |
| `emptyMessage`                                   | `ReactNode`                               | —             | Shown when nothing matches.                                      |
| `action`                                         | `{ label: string, onAction(inputValue) }` | —             | Footer row after the options; the label is its accessible name.  |
| `optionLayout`                                   | `'inline' \| 'stacked'`                   | `inline`      | Description beside or under the label.                           |
| `placeholder`                                    | `string`                                  | —             | Empty edit hint.                                                 |
| `disabled` / `readOnly` / `invalid` / `required` | `boolean`                                 | `false`       | Semantic and visual state.                                       |
| `id` / `name`                                    | `string`                                  | Generated / — | Label association and native form field name (the selected key). |
| `description` / `errorMessage`                   | `ReactNode`                               | —             | Associated help and invalid-state content.                       |
| `pt`                                             | `ComboBoxParts`                           | —             | Part classes, styles, titles and data attributes.                |

## Stable parts and tokens

| Typed `pt` key / DOM part                      | Meaning                             | Canonical states                             |
| ---------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `root`                                         | Complete control                    | `disabled`, `invalid`, `readonly`, `loading` |
| `input`                                        | The `combobox` input                | `disabled`, `invalid`, `readonly`, `open`    |
| `trigger`                                      | The open button                     | `disabled`, `open`                           |
| `popover` / `listbox`                          | Portaled list                       | `open` / none                                |
| `option` / `optionLabel` / `optionDescription` | One option and its texts            | `disabled`, `selected` / none / none         |
| `loading` / `empty` / `failure`                | The three not-ready messages        | none                                         |
| `action`                                       | The footer row                      | none                                         |
| `description` / `error`                        | Supporting text, validation message | none / `invalid`                             |

The component uses the shared control, surface, overlay, text, highlight, focus and disabled tokens and introduces none of its own. Use parts and tokens rather than internal element order or implementation-library selectors.

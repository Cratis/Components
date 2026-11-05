---
title: Choose Cratis Components display primitives
description: Choose Cratis Components display primitives for status labels, identity, progress, and loading placeholders, with props and accessibility guidance.
---

Cratis Components Display provides small UI elements for showing status, identity, progress, and loading states. Use them to help people recognize an item, understand an operation's result, or see that content is still loading.

Import these components from `@cratis/components/Display`.

## Choose what to show

Start with the information the person using your screen needs. A short label can identify an item's status; an operation's result usually needs a message that explains what happened.

| What you need to show | Component | When to choose it |
| --- | --- | --- |
| An item's status | [Tag](#tag) | A short label such as “In stock” belongs beside the item. |
| A count or compact marker | [Badge](#badge) | A number or short value adds context to an icon or button. |
| A selected value or filter | [Chip](#chip) | A labeled token represents a selection, optionally with a remove control. |
| A person or entity | [Avatar](#avatar) | An image, initials, or an icon helps identify who or what the item represents. |
| An operation's result or inline guidance | [Message](#message) | A sentence explains success, an error, or information relevant to the surrounding content. |
| Measured completion | [ProgressBar](#progressbar) | You have a percentage to show as work advances. |
| Work with no known completion percentage | [ProgressSpinner](#progressspinner) | You need to indicate that an operation is still running. |
| Content that has not loaded yet | [Skeleton](#skeleton) | Placeholder shapes reserve space for the expected content. |

The sections below give examples and props for each choice.

## Tag

Use `Tag` for a short status that stays beside an item, such as availability in a table row. The `severity` prop selects a meaning-based color from the active theme instead of requiring hand-colored text. To change those colors, use the [semantic CSS token reference](../Styling/cratis-tokens.md), and verify the resulting contrast in every application theme you ship.

```tsx
import { Tag } from '@cratis/components/Display';

<Tag severity="success" value="In stock" />
<Tag severity="danger" value="Out of stock" />
<Tag severity="info" value="Member" icon="product-icons product-user" />
```

| Prop        | Type                                                                     | Description                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`     | `ReactNode`                                                              | The label shown inside the tag (or pass `children`).                                                                                           |
| `severity`  | `'secondary' \| 'success' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone (drives the color).                                                                                                              |
| `rounded`   | `boolean`                                                                | Fully rounds the tag.                                                                                                                          |
| `icon`      | `ReactNode`                                                              | An icon rendered before the label. A string is treated as a complete consumer-owned icon-font CSS class; other React nodes render as supplied. |
| `className` | `string`                                                                 | Extra CSS class.                                                                                                                               |

## Badge

Use `Badge` for a count or compact marker associated with another element, such as an icon or button. Choose `Tag` instead when the label needs to describe the item's status in words.

```tsx
import { Badge } from '@cratis/components/Display';

<Badge value="8" severity="info" />
<Badge value="NEW" severity="success" />
```

| Prop        | Type                                                                     | Description                                            |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `value`     | `ReactNode`                                                              | The value shown inside the badge (or pass `children`). |
| `severity`  | `'secondary' \| 'info' \| 'success' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone.                                         |
| `size`      | `'small' \| 'large' \| 'xlarge'`                                         | Badge size.                                            |
| `shape`     | `'circle'`                                                               | Renders the badge as a circle.                         |
| `className` | `string`                                                                 | Extra CSS class.                                       |

## Chip

Use `Chip` to show a selected value or active filter as a labeled token. Set `removable` when the person should be able to clear it, and handle `onRemove` to update your selection state; the chip does not remove itself.

```tsx
import { Chip } from '@cratis/components/Display';

<Chip label="Design" />
<Chip label="Removable" removable onRemove={() => remove('design')} />
```

| Prop              | Type         | Description                                                                           |
| ----------------- | ------------ | ------------------------------------------------------------------------------------- |
| `label`           | `string`     | The chip label.                                                                       |
| `icon`            | `ReactNode`  | An icon rendered before the label.                                                    |
| `removable`       | `boolean`    | Shows a remove control.                                                               |
| `onRemove`        | `() => void` | Invoked when the remove control is activated.                                         |
| `removeAriaLabel` | `string`     | Accessible name for the remove control. Override to localize. Defaults to `'Remove'`. |
| `className`       | `string`     | Extra CSS class.                                                                      |

## Avatar

Use `Avatar` to identify a person or entity with an image, initials, or an icon. Supply `label` or `icon` when you do not have an image URL.

```tsx
import { Avatar } from '@cratis/components/Display';

<Avatar image="/users/sample-user.png" />
<Avatar label="SU" />
```

| Prop        | Type                              | Description                                                                               |
| ----------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `image`     | `string`                          | Image URL. When present, the image is shown and everything below except `alt` is ignored. |
| `alt`       | `string`                          | Alternative text for `image`. Unused when there is no image.                              |
| `icon`      | `ReactNode`                       | Icon fallback when there is no image. Takes precedence over `label`.                      |
| `label`     | `string`                          | Initials/text fallback when there is no image and no icon.                                |
| `size`      | `'normal' \| 'large' \| 'xlarge'` | Avatar size.                                                                              |
| `className` | `string`                          | Extra CSS class.                                                                          |

The fallback order is `image` → `icon` → `label`, so passing both an `icon` and a `label` shows the icon.

`alt` defaults to an empty string, which marks the image as decorative. Pass `alt` when the avatar is the only place the person or entity is identified, for example `<Avatar image='/users/sample-user.png' alt='Sample User' />`.

## Message

Use `Message` when a label alone cannot explain the result or tell the person what to do next. It stays inline with the relevant content and supports a severity tone and optional leading icon. For app-wide toast notifications, follow the [Notifications guide](../Notifications/).

```tsx
import { Message } from '@cratis/components/Display';

<Message severity='success'>Saved successfully.</Message>
<Message severity='error' text='The request failed.' />
<Message severity='info' icon={false}>No icon is shown.</Message>
```

To place a message inside a live region that already announces it, pass `live={false}`:

```tsx
<div role='alert' aria-label='Error summary'>
    <Message severity='error' live={false}>The name is required.</Message>
</div>
```

| Prop        | Type                                                                    | Description                                                                                         |
| ----------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `severity`  | `'info' \| 'success' \| 'warn' \| 'error' \| 'secondary' \| 'contrast'` | Visual and semantic tone. Defaults to `'info'`.                                                     |
| `text`      | `ReactNode`                                                             | Message content when `children` is not provided.                                                    |
| `children`  | `ReactNode`                                                             | Message content; takes precedence over `text`.                                                      |
| `icon`      | `ReactNode \| false`                                                    | Custom leading icon. Pass `false` to hide the icon; otherwise a severity symbol is used by default. |
| `className` | `string`                                                                | Extra CSS class on the root.                                                                        |
| `live`      | `boolean`                                                               | Whether the message is its own live region. Defaults to `true`; pass `false` for no `role`.         |

By default, error messages use `role='alert'` and every other severity uses `role='status'`. With `live={false}` the message renders without a `role`, so it is announced only by the live region around it; do not use it for a message that stands alone. Nesting a live message inside another live region makes screen readers announce it twice. The decorative icon is hidden from assistive technology. Stable `root`, `icon`, and `text` `data-cratis-part` markers are available for styling and tests.

## ProgressSpinner

Use `ProgressSpinner` to show that work is running when you do not know its completion percentage. This is an indeterminate indicator: it shows activity without claiming how much work remains. Give it an `aria-label` that names the operation.

```tsx
import { ProgressSpinner } from '@cratis/components/Display';

<ProgressSpinner aria-label='Loading authors' />
<ProgressSpinner style={{ width: '2rem', height: '2rem' }} />
```

| Prop         | Type            | Description                                                                             |
| ------------ | --------------- | --------------------------------------------------------------------------------------- |
| `style`      | `CSSProperties` | Root styles; use width and height to size the spinner.                                  |
| `className`  | `string`        | Extra CSS class on the root.                                                            |
| `aria-label` | `string`        | Loading status announced to assistive technology. Defaults to `'Loading'`; localize it. |

`ProgressSpinner` renders a `role='status'` root. It exposes stable `root`, `svg`, `track`, and `range` `data-cratis-part` markers plus `data-busy='true'` and `data-loading='true'` on the root.

## ProgressBar

Use `ProgressBar` when you can report completion as a percentage. Update `value` as your operation advances; the bar displays that value but does not track the work itself. If you need the same horizontal shape without a known percentage, set `mode="indeterminate"` to show activity without a completion value.

```tsx
import { ProgressBar } from '@cratis/components/Display';

<ProgressBar value={65} />
<ProgressBar mode="indeterminate" />
```

| Prop              | Type                               | Description                                                                                                                 |
| ----------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `number`                           | Completion value, `0`–`100`. Ignored in `indeterminate` mode.                                                               |
| `mode`            | `'determinate' \| 'indeterminate'` | `determinate` (default) shows `value`; `indeterminate` shows a looping animation.                                           |
| `showValue`       | `boolean`                          | Whether to render the percentage label. Defaults to `true` (determinate only). The label is always `value` followed by `%`. |
| `aria-label`      | `string`                           | Accessible name. Defaults to `'Progress'`; override it to describe the operation.                                           |
| `aria-labelledby` | `string`                           | Id of an external element that labels the progress indicator.                                                               |
| `className`       | `string`                           | Extra CSS class on the root.                                                                                                |

`ProgressBar` exposes stable `root`, `indicator`, and `label` `data-cratis-part` markers and
`data-mode` on the root. It does not expose a `pt` prop; use `className`, the stable markers, or
semantic tokens for product styling.

## Skeleton

Use `Skeleton` when you know the shape of the content that will appear but its data has not loaded yet. Size the placeholders to reserve space for that content, then replace them when it is ready. A skeleton describes the expected layout, not the operation's progress.

```tsx
import { Skeleton } from '@cratis/components/Display';

<Skeleton width="12rem" height="1rem" />
<Skeleton height="3rem" circle />
```

| Prop           | Type      | Description                                                                                 |
| -------------- | --------- | ------------------------------------------------------------------------------------------- |
| `width`        | `string`  | Any CSS length. Defaults to `'100%'`. Ignored when `circle` is set.                         |
| `height`       | `string`  | Any CSS length. Defaults to `'1rem'`. Drives **both** dimensions when `circle` is set.      |
| `borderRadius` | `string`  | Any CSS length. Ignored when `circle` is set (which forces `50%`).                          |
| `circle`       | `boolean` | Renders a circle: `height` is used for width and height, and the radius is forced to `50%`. |
| `className`    | `string`  | Extra CSS class.                                                                            |

Because `circle` takes its size from `height`, set `height` rather than `width` for a circular skeleton. `<Skeleton circle />` on its own renders at the `1rem` default.

`Skeleton` is hidden from assistive technology (`aria-hidden='true'`), so a screen reader hears nothing while it is shown. When loading takes noticeable time, pair skeletons with a status announcement such as a `ProgressSpinner` with an `aria-label`, or visually hidden `role='status'` text.

# Display

The `Display` components are small, presentational primitives for status and feedback — tags, badges, chips, avatars, progress, and loading skeletons. Import them from `@cratis/components/Display`.

Use them for status indicators in tables and detail views, counts on icons, removable filter tokens, user avatars, progress feedback, and placeholder shapes while data loads.

## Tag

A small colored status label. Prefer a `Tag` with a `severity` over hand-colored text so it follows the active semantic theme. Verify the resulting contrast in every application theme you ship.

```tsx
import { Tag } from '@cratis/components/Display';

<Tag severity="success" value="In stock" />
<Tag severity="danger" value="Out of stock" />
<Tag severity="info" value="Member" icon="product-icons product-user" />
```

| Prop | Type | Description |
|------|------|-------------|
| `value` | `ReactNode` | The label shown inside the tag (or pass `children`). |
| `severity` | `'secondary' \| 'success' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone (drives the color). |
| `rounded` | `boolean` | Fully rounds the tag. |
| `icon` | `ReactNode` | An icon rendered before the label. A string is treated as a complete consumer-owned icon-font CSS class; other React nodes render as supplied. |
| `className` | `string` | Extra CSS class. |

## Badge

A small count or status marker, typically overlaid on an icon or button.

```tsx
import { Badge } from '@cratis/components/Display';

<Badge value="8" severity="info" />
<Badge value="NEW" severity="success" />
```

| Prop | Type | Description |
|------|------|-------------|
| `value` | `ReactNode` | The value shown inside the badge (or pass `children`). |
| `severity` | `'secondary' \| 'info' \| 'success' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone. |
| `size` | `'small' \| 'large' \| 'xlarge'` | Badge size. |
| `shape` | `'circle'` | Renders the badge as a circle. |
| `className` | `string` | Extra CSS class. |

## Chip

A labeled, optionally-removable token. Use for filter pills and selected values.

```tsx
import { Chip } from '@cratis/components/Display';

<Chip label="Design" />
<Chip label="Removable" removable onRemove={() => remove('design')} />
```

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | The chip label. |
| `icon` | `ReactNode` | An icon rendered before the label. |
| `removable` | `boolean` | Shows a remove control. |
| `onRemove` | `() => void` | Invoked when the remove control is activated. |
| `removeAriaLabel` | `string` | Accessible name for the remove control. Override to localize. Defaults to `'Remove'`. |
| `className` | `string` | Extra CSS class. |

## Avatar

A user/entity avatar showing an image, initials, or an icon fallback.

```tsx
import { Avatar } from '@cratis/components/Display';

<Avatar image="/users/sample-user.png" />
<Avatar label="SU" />
```

| Prop | Type | Description |
|------|------|-------------|
| `image` | `string` | Image URL. When present, the image is shown and everything below except `alt` is ignored. |
| `alt` | `string` | Alternative text for `image`. Unused when there is no image. |
| `icon` | `ReactNode` | Icon fallback when there is no image. Takes precedence over `label`. |
| `label` | `string` | Initials/text fallback when there is no image and no icon. |
| `size` | `'normal' \| 'large' \| 'xlarge'` | Avatar size. |
| `className` | `string` | Extra CSS class. |

The fallback order is `image` → `icon` → `label`, so passing both an `icon` and a `label` shows the icon.

## ProgressBar

A horizontal progress indicator, determinate or indeterminate.

```tsx
import { ProgressBar } from '@cratis/components/Display';

<ProgressBar value={65} />
<ProgressBar mode="indeterminate" />
```

| Prop | Type | Description |
|------|------|-------------|
| `value` | `number` | Completion value, `0`–`100`. Ignored in `indeterminate` mode. |
| `mode` | `'determinate' \| 'indeterminate'` | `determinate` (default) shows `value`; `indeterminate` shows a looping animation. |
| `showValue` | `boolean` | Whether to render the percentage label. Defaults to `true` (determinate only). The label is always `value` followed by `%`. |
| `aria-label` | `string` | Accessible name. Defaults to `'Progress'`; override it to describe the operation. |
| `aria-labelledby` | `string` | Id of an external element that labels the progress indicator. |
| `className` | `string` | Extra CSS class on the root. |

`ProgressBar` exposes stable `root`, `indicator`, and `label` `data-cratis-part` markers and
`data-mode` on the root. It does not expose a `pt` prop; use `className`, the stable markers, or
semantic tokens for product styling.

## Skeleton

A placeholder shape shown while content loads.

```tsx
import { Skeleton } from '@cratis/components/Display';

<Skeleton width="12rem" height="1rem" />
<Skeleton height="3rem" circle />
```

| Prop | Type | Description |
|------|------|-------------|
| `width` | `string` | Any CSS length. Defaults to `'100%'`. Ignored when `circle` is set. |
| `height` | `string` | Any CSS length. Defaults to `'1rem'`. Drives **both** dimensions when `circle` is set. |
| `borderRadius` | `string` | Any CSS length. Ignored when `circle` is set (which forces `50%`). |
| `circle` | `boolean` | Renders a circle: `height` is used for width and height, and the radius is forced to `50%`. |
| `className` | `string` | Extra CSS class. |

Because `circle` takes its size from `height`, set `height` rather than `width` for a circular skeleton — `<Skeleton circle />` on its own renders at the `1rem` default.

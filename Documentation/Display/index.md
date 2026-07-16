# Display

The `Display` components are small, presentational primitives for status and feedback — tags, badges, chips, avatars, progress, and loading skeletons. Import them from `@cratis/components/Display`.

Use them for status indicators in tables and detail views, counts on icons, removable filter tokens, user avatars, progress feedback, and placeholder shapes while data loads.

## Tag

A small colored status label. Prefer a `Tag` with a `severity` over hand-colored text — it is theme-aware and meets contrast in light and dark.

```tsx
import { Tag } from '@cratis/components/Display';

<Tag severity="success" value="In stock" />
<Tag severity="danger" value="Out of stock" />
```

| Prop | Type | Description |
|------|------|-------------|
| `value` | `ReactNode` | The label shown inside the tag (or pass `children`). |
| `severity` | `'secondary' \| 'success' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone (drives the color). |
| `rounded` | `boolean` | Fully rounds the tag. |
| `icon` | `ReactNode` | An icon rendered before the label. |
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
| `severity` | `'secondary' \| 'success' \| 'info' \| 'warn' \| 'danger' \| 'contrast'` | Severity tone. |
| `size` | `'normal' \| 'large' \| 'xlarge'` | Badge size. |
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

<Avatar image="/users/jane.png" />
<Avatar label="JD" />
```

| Prop | Type | Description |
|------|------|-------------|
| `image` | `string` | Image URL. When present, the image is shown. |
| `label` | `string` | Initials/text fallback when no image is available. |
| `icon` | `ReactNode` | Icon fallback when no image or label is available. |
| `size` | `'normal' \| 'large' \| 'xlarge'` | Avatar size. |

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
| `showValue` | `boolean` | Whether to render the percentage label. Defaults to `true` (determinate only). |

## Skeleton

A placeholder shape shown while content loads.

```tsx
import { Skeleton } from '@cratis/components/Display';

<Skeleton width="12rem" height="1rem" />
<Skeleton width="3rem" height="3rem" circle />
```

| Prop | Type | Description |
|------|------|-------------|
| `width` | `string` | Any CSS length. Defaults to `'100%'`. |
| `height` | `string` | Any CSS length. Defaults to `'1rem'`. |
| `circle` | `boolean` | Renders a circle (equal width/height, fully rounded). |

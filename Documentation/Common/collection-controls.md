---
title: Collection controls
description: Choose a value, switch a view, edit a set of values, and show a breadcrumb trail with ToggleGroup, Tabs, TagGroup and Breadcrumbs.
---

Four controls for choosing among a set, moving through a set, editing a set, and showing where you
are in one: `ToggleGroup`, `Tabs`, `TagGroup` and `Breadcrumbs`. Each is a thin Cratis surface over
its React Aria equivalent, so the keyboard behavior and the roles come from the foundation and the
appearance is entirely yours through parts. All four are controlled and import from the `Common`
subpath:

```tsx
import { Breadcrumbs, Tabs, TagGroup, ToggleGroup } from '@cratis/components/Common';
```

## Choosing one: `ToggleGroup` or `Tabs`

These two look alike and mean different things, so pick by what the choice *does*:

| | `ToggleGroup` | `Tabs` |
|---|---|---|
| The choice is | a **value** — a period, a mode, a filter | a **view** — which panel of content is shown |
| Roles | `radiogroup` / `radio` | `tablist` / `tab` / `tabpanel` |
| Arrow keys | move focus; Space or Enter commits | move the selection, and the panel follows |
| Belongs in a form | yes — it is an input | no |

The distinction matters to a screen-reader user, who is told which of the two they have. A segmented
control built out of `tablist` announces a panel switcher that switches nothing.

`ToggleGroup`'s arrow keys move focus rather than selecting, because a segmented control often drives
a query: arrowing from `Day` to `Month` must not run the month query on the way past.

```tsx
<ToggleGroup
    options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
    ]}
    value={period}
    onChange={setPeriod}
    aria-labelledby='period-label'
/>
```

A group has no single labelable element, so an external `<label>` associates with
`aria-labelledby` rather than `htmlFor`. `invalid` and `aria-describedby` wire it to a field's error
text.

```tsx
<Tabs
    tabs={[
        { id: 'open', label: 'Open', content: <OpenRequests /> },
        { id: 'closed', label: 'Closed', content: <ClosedRequests /> },
    ]}
    value={tab}
    onChange={setTab}
    aria-label='Requests'
/>
```

Every tab owns a panel and is wired to it through `aria-controls`. That is why `content` is required:
the selected tab names its panel, so a tab set without panels would point at an element that is not
there. When the choice drives a view rendered elsewhere it is a **value**, not a panel — use
`ToggleGroup`, which tells assistive technology exactly that.

## Editing a set: `TagGroup`

A group of removable values with an optional text entry — the control behind a tag or chips field.

```tsx
<TagGroup
    value={skills}
    onChange={setSkills}
    placeholder='Add a skill…'
    removeLabel={(skill) => `Remove ${skill}`}
    aria-labelledby='skills-label'
/>
```

| Key | Does |
|---|---|
| `Enter`, or any `separators` character (default `,`) | commits the typed value |
| `Backspace` on an empty entry | removes the last value |
| Arrow keys on a tag | moves between tags |
| `Backspace` or `Delete` on a tag | removes that tag |
| paste containing a separator | splits and adds each value |

Duplicates are refused unless `allowDuplicates` is set. `editable={false}` drops the entry and leaves
a read-only set of removable tags. Give `removeLabel` a localized builder — the remove buttons are
the one place this control needs words of its own — and `removeIcon` your icon set's close icon,
which replaces the default `×` without touching the button or its accessible name.

## Showing where you are: `Breadcrumbs`

```tsx
<Breadcrumbs
    aria-label='Breadcrumb'
    items={[
        { label: 'Requests', href: '/requests' },
        { label: 'Example Project', href: '/requests/example-project' },
        { label: 'REQ-0001' },
    ]}
/>
```

The **last item is the current page**: it carries `aria-current="page"`, has no destination and is
out of the tab order. That is what tells a screen-reader user where the trail ends, and it is why
every segment renders as a link — React Aria hands the current state down to the last one, and a
segment rendered as plain text would lose it.

Pass `onNavigate` instead of `href` when a router owns navigation. `separator` takes any decorative
node and defaults to a slash; separators are hidden from assistive technology either way.

## Styling

Every control is styled through its parts — see the [pass-through cheat sheet](../Styling/pass-through.md):

| Control | Parts |
|---|---|
| `ToggleGroup` | `root`, `option`, `icon`, `label` |
| `Tabs` | `root`, `list`, `tab`, `panel` |
| `TagGroup` | `root`, `list`, `tag`, `remove`, `input` |
| `Breadcrumbs` | `root`, `item`, `link`, `separator` |

The selected option, tab, current breadcrumb and their disabled/invalid states are exposed as
`data-selected`, `data-disabled` and `data-invalid`, so a stylesheet never needs to know the
component's internals.

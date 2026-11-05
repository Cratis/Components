---
title: Collection controls for values and navigation
description: Use ToggleGroup for a value, Tabs for content panels, TagGroup for removable values, and Breadcrumbs for navigation through a hierarchy.
---

Use `ToggleGroup` to choose a value, `Tabs` to reveal a content panel, `TagGroup` to edit removable
values, and `Breadcrumbs` to show the current page in a hierarchy. Choose by what the user needs to
change: selecting a filter value is different from opening a panel or following a link.

These controls use React Aria for keyboard interaction and accessibility roles, with Cratis parts
for styling. Your component owns the selected value for `ToggleGroup` and `Tabs`, the list of values
for `TagGroup`, and the navigation items for `Breadcrumbs`. Import them from the `Common` subpath:

```tsx
import { Breadcrumbs, Tabs, TagGroup, ToggleGroup } from '@cratis/components/Common';
```

## Choosing one: `ToggleGroup` or `Tabs`

Use `ToggleGroup` for a small set of exclusive values, such as a reporting period. Use `Tabs` when
each choice has its own content panel:

| | `ToggleGroup` | `Tabs` |
|---|---|---|
| The choice is | a value: a period, a mode, or a filter | a panel of content to show |
| Roles | `radiogroup` / `radio` | `tablist` / `tab` / `tabpanel` |
| Arrow keys | move focus; Space or Enter commits | move the selection, and the panel follows |
| Belongs in a form | yes — it is an input | no |

The roles tell screen-reader users whether they are changing an input or switching panels.
`ToggleGroup`'s arrow keys move focus without calling `onChange`; Space or Enter selects the focused
option. If your change handler starts a query, moving focus past `Week` on the way to `Month` does
not start a query for `Week`.

In this example, `period` is the current value and `setPeriod` updates your component's state:

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

Provide a visible label element with `id='period-label'` for this example. A group has no single
labelable element, so use `aria-labelledby` instead of `htmlFor`. Your application supplies any
validation message; use `invalid` to mark the group invalid and `aria-describedby` to reference that
message.

For panels, supply each tab's content and keep the selected tab's ID in your component's state:

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

Each tab's required `content` supplies its panel, linked to the tab through `aria-controls`. Selecting
`Closed` displays `ClosedRequests` in that panel. If a choice instead changes a view rendered
elsewhere, use `ToggleGroup`: that choice changes a value without owning a panel.

## Editing a set: `TagGroup`

Use `TagGroup` when users need to add or remove string values, such as skills. In this example,
`skills` holds the current list and `setSkills` accepts the next list. Provide a visible label with
`id='skills-label'` to name the control.

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

The control trims added values, ignores empty entries, and refuses duplicates unless `allowDuplicates`
is set. Leaving the input also commits a nonempty draft. Your application handles any domain-specific
validation and persistence in addition to updating the list.

`editable={false}` hides the entry but still allows removal; it does not make the tags read-only.
Use `disabled` to prevent both adding and removing values. Give `removeLabel` a localized function
that names each remove action. Set `removeIcon` to use your icon set's close icon instead of the
default `×`; this changes the glyph without changing the button or its accessible name.

## Showing where you are: `Breadcrumbs`

Supply the trail in hierarchy order, starting with the outermost page. Your application builds the
items for the current route; `Breadcrumbs` does not discover the hierarchy.

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

The last item is always the current page. It carries `aria-current="page"`, has no destination, and
is out of the tab order, even if you supply an `href`. Earlier items use their `href` as the destination.
Internally, every segment uses React Aria's link component so the final segment receives the current-page
state.

For client-side navigation, configure [provider routing](cratis-components-provider.md#connect-a-client-side-router)
and keep plain `href` items as above. Ordinary same-origin activations use the configured router;
modified clicks, middle clicks, and external links retain browser handling. Without provider routing,
links navigate natively or use an inherited router.

The legacy `onNavigate` press callback still works, but does not replace `href` navigation. Manually
navigating there as well as through the provider can navigate twice. `separator` takes any decorative
node and defaults to a slash; separators are hidden from assistive technology either way.

## Styling

Every control is styled through its parts — see the [pass-through cheat sheet](../Styling/pass-through.md):

| Control | Parts |
|---|---|
| `ToggleGroup` | `root`, `option`, `icon`, `label` |
| `Tabs` | `root`, `list`, `tab`, `panel` |
| `TagGroup` | `root`, `list`, `tag`, `remove`, `input` |
| `Breadcrumbs` | `root`, `item`, `link`, `separator` |

Use `data-selected` to style the selected option, selected tab and panel, or current breadcrumb.
`ToggleGroup`, `Tabs`, and `TagGroup` expose `data-disabled` where applicable; `ToggleGroup` and
`TagGroup` also expose `data-invalid`. These attributes let your styles follow state through the
published parts without depending on internal markup.

For a value bound to an Arc command, continue with [CommandForm fields](../CommandForm/index.md).
For app-wide navigation callbacks, follow the [provider routing setup](cratis-components-provider.md#connect-a-client-side-router).

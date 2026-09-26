---
title: Page
description: Give a routed view a full-height column layout with an optional visible title.
---

`Page` is a layout primitive for the root of a routed view. It renders a flex column that fills its parent's height, an optional level-1 heading, and a `<main>` element that takes the remaining space and clips overflow.

## Purpose

Use `Page` when every view in an application should share the same outer structure: a column that fills the available height, with the content region below an optional title.

## Key Features

- Full-height flex column layout
- Optional visible `h1` title
- A `<main>` content region that grows to fill the remaining space
- Standard `div` attributes forwarded to the root element

## Basic Usage

```tsx
import { Page } from '@cratis/components/Common';

export const AuthorsPage = () => (
    <Page title='Authors'>
        <p>Page content goes here</p>
    </Page>
);
```

## Showing the Title

By default the title is not rendered. Pass `showTitle` to render it as an `h1` above the content:

```tsx
<Page title='Authors' showTitle>
    <p>Page content goes here</p>
</Page>
```

When `showTitle` is `false`, `title` is not written to the DOM at all: it does not set `document.title`, an `aria-label`, or any other attribute. Set the browser tab title and any hidden heading yourself.

## With Panel Styling

`panel` adds a bare `panel` class to the `<main>` element. The Components stylesheets ship no rule for that class, so it has no visible effect until your own CSS defines `.panel`:

```tsx
<Page title='Dashboard' panel>
    <p>Content inside the main region</p>
</Page>
```

## Props

| Prop         | Type                             | Default  | Description                                                                                  |
| ------------ | -------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `title`      | `string`                         | Required | Page title. Rendered only when `showTitle` is `true`.                                        |
| `showTitle`  | `boolean`                        | `false`  | Renders `title` as an `h1` above the content.                                                |
| `panel`      | `boolean`                        | `false`  | Adds a `panel` class to `<main>`. No styling for it ships with Components.                   |
| `children`   | `ReactNode`                      | —        | Page content, rendered inside `<main>`.                                                      |
| other props  | `HTMLAttributes<HTMLDivElement>` | —        | Forwarded to the root `div` (`id`, `style`, `aria-*`, `data-*`, event handlers, `className`). |

A `className` you pass is added after the root's layout classes, so the root keeps its flex column and full height. In Components 4.14.1 and earlier, a passed `className` replaced those layout classes instead.

## Layout

- The root is a flex column that fills its parent's height (`height: 100%`, `flex: 1`).
- The optional `h1` sits at the top.
- `<main>` fills the remaining space as a flex column and hides overflow. Put a scrolling element inside it when the content can be taller than the view.

`Page` renders a `<main>` landmark. Use one `Page` per view, and do not put it inside another `<main>` element, because a document should have only one visible `main` landmark.

## Examples

### Simple Page

```tsx
<Page title='Users' showTitle>
    <UserList />
</Page>
```

### Page with Multiple Sections

The content is yours to lay out. Components ships no utility classes, so use your own CSS or inline styles:

```tsx
<Page title='Dashboard' showTitle>
    <section aria-label='Totals' style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard title='Users' value={totalUsers} />
        <StatCard title='Orders' value={totalOrders} />
        <StatCard title='Revenue' value={totalRevenue} />
    </section>
    <section aria-label='Recent activity' style={{ marginTop: '1rem', overflow: 'auto' }}>
        <RecentActivity />
    </section>
</Page>
```

`StatCard` and `RecentActivity` stand for your own components.

### Page with Custom Styling

```tsx
<Page title='Reports' data-view='reports' style={{ backgroundColor: 'var(--cratis-surface-ground)' }}>
    <ReportViewer />
</Page>
```

## Integration

`Page` has no routing or data dependencies. Render it as the element of a route in any router, and put any Components or product-owned content inside it.

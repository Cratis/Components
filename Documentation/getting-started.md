---
title: Getting started
description: Install Components, wire the provider, and render your first command form and data table.
sidebar:
  order: 2
---

This gets `@cratis/components` installed and rendering. By the end you'll have the provider mounted and know where to go for forms and tables.

## 1. Install

Install the package and its PrimeReact peers:

```bash
npm install @cratis/components primereact primeicons
```

The optional peers (`pixi.js` for `PivotViewer`, `framer-motion` for animated panels, `allotment` for `DataPage`) are only needed when you use those components.

## 2. Import the styles

Import the pre-compiled utility styles once, at your app entry point:

```typescript
import '@cratis/components/styles';
```

This works with any bundler and ships the [`--cratis-*` token layer](/components/styling/) the components read from.

## 3. Mount the provider

Wrap your app in `CratisComponentsProvider`. It configures PrimeReact's global settings (unstyled mode, pass-through, locale, ripple, overlay z-index):

```tsx
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

## 4. Choose how styling works

The components render structurally as soon as the provider is mounted. Give them a visual identity by picking one setup — see [Styling](/components/styling/):

- a PrimeReact theme,
- a custom palette on top of a theme, or
- fully unstyled with your own pass-through preset.

## Next

Now build something:

- [Building a form](/components/building-a-form/) — execute a command with `CommandDialog` and form fields.
- [Displaying data](/components/displaying-data/) — show query results in a live data table.
- The full, interactive component catalog is in **Storybook** (see the Components reference pages).

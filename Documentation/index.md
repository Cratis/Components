# Cratis Components

The Cratis Components library provides a comprehensive set of reusable React components built on top of PrimeReact, designed specifically for building data-driven applications with the Cratis Arc framework.

## Overview

This library includes specialized components for:

- **Command Handling**: Dialog and form components for executing commands
- **Data Display**: Advanced data tables and pages for queries and observable queries
- **Data Visualization**: Pivot viewers, time machines, and schema editors
- **Common UI Elements**: Pages, dialogs, and form elements
- **Navigation**: Object navigational bars and content editors

## Key Features

- Built with TypeScript for type safety
- Integrates seamlessly with Cratis Arc framework
- Uses PrimeReact components for consistent UI/UX
- Supports both queries and observable queries
- Three supported [styling options](Styling/index.md) — use a PrimeReact theme, apply your own palette, or run fully unstyled
- Full PrimeReact `pt` (pass-through) forwarding on every wrapper for per-slot styling
- Comprehensive Storybook documentation
- Accessibility-focused design

## Getting Started

### Install

Install `@cratis/components` along with the required PrimeReact peer dependencies:

```bash
npm install @cratis/components primereact primeicons
# or
yarn add @cratis/components primereact primeicons
```

The optional peers (`pixi.js` for `PivotViewer`, `framer-motion` for animated panels, `allotment` for `DataPage` resizable layout) are only required when you use the corresponding component.

### Importing Styles

The library ships pre-compiled utility styles that must be imported once in your application entry point (e.g. `main.tsx`):

```typescript
import '@cratis/components/styles';
```

This is required because the components use Tailwind utility classes that are compiled into the package at build time, and because it ships the [`--cratis-*` token layer](Styling/cratis-tokens.md) every Cratis-scoped surface reads from. The import works with any bundler (Vite, webpack, Rollup) regardless of whether your application uses Tailwind.

If you bring your own Tailwind setup and want only the token layer, import `@cratis/components/tokens` instead.

### Wire the Provider

Mount [`CratisComponentsProvider`](Common/cratis-components-provider.md) at the root of your tree to configure PrimeReact's global settings — `unstyled`, `pt`, `ptOptions`, locale, ripple, overlay z-index, and the rest:

```tsx
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

### Choose how styling works

The components render structurally as soon as the provider is mounted. To give them a visual identity, choose the setup that matches how much control you need:

- [**Use a PrimeReact theme**](Styling/themed.md) — load a theme stylesheet and tweak with CSS or `className` as needed.
- [**Use a custom palette on top of a PrimeReact theme**](Styling/custom-palette.md) — keep the theme's structure and repaint with CSS variables on `:root`.
- [**Use fully unstyled mode**](Styling/unstyled.md) — disable PrimeReact's base styles and provide the visuals through a `pt` preset in CSS or Tailwind.

See the [Styling overview](Styling/index.md) for the full mental model.

### Importing Components

All components are exported from the main package and can be imported as needed:

```typescript
import { CommandDialog, DataPage, PivotViewer } from '@cratis/components';
```

For tree-shaking-friendly subpath imports:

```typescript
import { Dialog } from '@cratis/components/Dialogs';
import { DataPage } from '@cratis/components/DataPage';
import { InputTextField } from '@cratis/components/CommandForm/fields';
```

## Component Categories

### Command Components

Components for handling command execution and user interactions — `CommandDialog`, `StepperCommandDialog`, `CommandStepper`, and the full `CommandForm/fields` set (text, number, dropdown, date, checkbox, radio, slider, multiselect, chips, color picker).

### Data Components

Components for displaying and interacting with data from queries — `DataPage`, `DataTableForQuery`, `DataTableForObservableQuery`.

### Common Components

Reusable UI elements for building consistent layouts — [`CratisComponentsProvider`](Common/cratis-components-provider.md), `Page`, `FormElement`, `Icon`, `Tooltip`, `ErrorBoundary`.

### Specialized Components

Advanced components for specific use cases — `PivotViewer`, `TimeMachine`, `SchemaEditor`, `ObjectContentEditor`, `ObjectNavigationalBar`.

## Styling

Styling is designed to stay out of the way: choose the setup that matches how much control you want, and the other layers stay invisible. See the dedicated [Styling section](Styling/index.md) for:

- [Getting Started](Styling/getting-started.md) — the one-line setup every option shares
- [Use a PrimeReact theme](Styling/themed.md)
- [Use a custom palette on top of a PrimeReact theme](Styling/custom-palette.md)
- [Use fully unstyled mode](Styling/unstyled.md)
- [Cratis token reference](Styling/cratis-tokens.md)
- [Pass-through (pt) cheat sheet](Styling/pass-through.md)
- [Combining styling setups](Styling/mixing-paths.md)

## Upgrading from an earlier release

See the [Migration guide](migration.md) for the required install changes (PrimeReact and PrimeIcons are now peer dependencies), the visual differences to be aware of, and a tour of the new optional capabilities (Cratis Components Provider, `--cratis-*` tokens, full `pt` forwarding).

## Development

The components are built using:

- Vite for development and bundling
- Vitest for testing
- Storybook for component documentation (`yarn dev` from `Source/`)
- yarn for package management

## Documentation

Each component includes comprehensive documentation and examples in Storybook. See the individual component pages for detailed usage instructions, props documentation, and live examples.

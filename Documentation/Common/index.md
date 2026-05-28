# Common Components

The Common module provides reusable UI components and the styling setup primitive that serve as building blocks for applications.

## Components

- **CratisComponentsProvider**: Single setup point for Cratis Components — wraps PrimeReact's `PrimeReactProvider` and hosts the `pt`, `unstyled`, locale, and other global configuration.
- **Icon / IconDisplay**: Unified icon type that accepts a PrimeIcons CSS class string or any React node.
- **Page**: Layout primitive for consistent page structures.
- **FormElement**: Lightweight wrapper that places an icon addon to the left of a form input.
- **ErrorBoundary**: Error handling for React component trees.

## See Also

- [CratisComponentsProvider](cratis-components-provider.md) — global setup, `pt` / `unstyled` configuration
- [Icon](icon.md) - Icon type and IconDisplay component
- [Page](page.md) - Page layout component
- [FormElement](form-element.md) - Form field icon-addon wrapper
- [ErrorBoundary](error-boundary.md) - Error boundary component
- [Styling Overview](../Styling/index.md) — three styling paths and how Common fits in

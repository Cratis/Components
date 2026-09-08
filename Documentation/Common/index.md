# Common Components

The Common module provides reusable UI components and the styling setup primitive that serve as building blocks for applications.

## Components

- **CratisComponentsProvider**: Locale, Components-owned labels, and optional app-wide toaster.
- **TextInput / TextArea**: Native text controls with semantic string changes and real element refs.
- **NumberInput**: Controlled locale-aware numeric entry with nullable values, fractions, bounds, adornments, and explicit commits.
- **Checkbox / Radio / Switch**: Native form choices with semantic boolean changes and browser-owned submission and reset behavior.
- **Button / IconButton**: Native actions with semantic variants, tones, loading, and disabled behavior.
- **Surface**: A bounded `div`, `section`, or `article` container with no invented interaction state.
- **Icon / IconDisplay**: Unified icon type that accepts a CSS class string or any React node.
- **Page**: Layout primitive for consistent page structures.
- **FormElement**: Lightweight wrapper that places an icon addon to the left of a form input.
- **ErrorBoundary**: Error handling for React component trees.

## See Also

- [Basic controls](basic-controls.md) — native form, ref, change, part, and state contracts
- [Locale-aware number input](number-input.md) — locale, nullable edit, commit, adornment, range, part, and token contracts
- [CratisComponentsProvider](cratis-components-provider.md) — locale, labels, and toaster configuration
- [Icon](icon.md) - Icon type and IconDisplay component
- [Page](page.md) - Page layout component
- [FormElement](form-element.md) - Form field icon-addon wrapper
- [ErrorBoundary](error-boundary.md) - Error boundary component
- [Styling Overview](../Styling/index.md) — the supported styling options and how Common fits in

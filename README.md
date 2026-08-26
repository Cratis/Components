# Cratis Components

Components is a React component library aligned with Arc application patterns.

This is the owning source repository for `@cratis/components`. The current
package uses Cratis-owned React markup, public TypeScript types, design tokens,
stable parts, and state attributes. React Aria is an internal implementation
dependency for selected interaction primitives.

[![NPM](https://img.shields.io/npm/v/@cratis/components?label=@cratis/components&logo=npm)](https://www.npmjs.com/package/@cratis/components)
[![Publish](https://github.com/Cratis/Components/actions/workflows/publish.yml/badge.svg)](https://github.com/Cratis/Components/actions/workflows/publish.yml)
[![Documentation](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml/badge.svg)](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml)

## Start here

- [Browse the canonical Components documentation](https://cratis.io/components/)
- [Install and mount the provider](#minimal-setup)
- [Choose a component area](#what-components-owns)
- [Inspect the package source](https://github.com/Cratis/Components/tree/main/Source)

## What Components owns

| Area | Current package role |
| --- | --- |
| Command input | Typed fields, embedded forms, dialogs, and multi-step command flows |
| Data display | Query-backed tables, local-array tables, list pages, filters, and detail surfaces |
| Application surfaces | Dialogs, notifications, dropdowns, display primitives, page chrome, and toolbars |
| Structured editors | JSON content, JSON Schema, navigation, canvas, pivot, and time-oriented views |
| Styling boundary | Cratis tokens, component styles, an optional baseline theme, and stable parts |

## Relationship to Arc

Components consumes generated command and query contracts and React contexts
from Arc packages. Arc owns those application contracts; Components owns the
React markup, public component types, styling tokens, stable parts, and component
behavior in this repository.

Applications may use Arc without Components. Components does not by itself
establish design-system completeness, accessibility conformance, browser
coverage, or compatibility with every Arc/React/package-version combination.
Verify those properties for the exact application and component profile shipped.

## Minimal setup

Install the package:

```bash
npm install @cratis/components
```

Import the semantic tokens and component structure. The baseline theme is
optional:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import '@cratis/components/theme'; // optional baseline appearance
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} toaster>
        <YourApp />
    </CratisComponentsProvider>
);
```

The current package manifest defines the exact React, Arc, Fundamentals, and
optional Pixi peer ranges. Verify those ranges before installing the package.

## Current boundaries

- The package manifest, exports, source, and migration guide define the current
  Components major-version surface.
- Workspace manifest versions in a source checkout are development inputs, not release
  identity. The release workflow stamps all three workspaces with the same requested
  version, then publishes them sequentially. It collects failures and fails the release,
  but a registry-side error can still leave a partial publication; verify all three exact
  coordinates before migration or release claims.
- Package existence, examples, Storybook output, and passing checks do not
  establish maturity, accessibility conformance, browser coverage, support,
  security, or production suitability.
- Direct third-party UI dependencies retained by an application keep their own
  package, provider, styling, and license boundaries.
- Use the exact package archive and application profile when evaluating an
  upgrade.

## Documentation and migration

- [Canonical Components documentation](https://cratis.io/components/)
- [Product-owned documentation source](https://github.com/Cratis/Components/tree/main/Documentation)
- [Package README](./Source/README.md)
- [Components 3 to 4 migration guide](./Source/MIGRATION.md)

## Migration tooling

The repository ships `@cratis/components-codemods` and
`@cratis/eslint-plugin-components` for moving Components 3 root namespace imports to
explicit subpaths and preventing regressions afterward. The [migration guide](./Source/MIGRATION.md)
owns the exact-version codemod command and stop cases; the [ESLint plugin
README](./ESLint/README.md) owns installation and flat-config composition. Use the same
published version as `@cratis/components` for both migration packages.

## Contributing

This is a framework-library repository. [Component source](https://github.com/Cratis/Components/tree/main/Source)
keeps public types, stories, and specifications near each component; export and
package verification lives under `Source/scripts/`.

For root and package README changes, verify the exact files explicitly:

```bash
npx markdownlint-cli2 README.md Source/README.md
npx linkinator README.md Source/README.md --markdown --recurse
```

Source changes follow the repository's framework rules and the applicable build,
type, specification, export, package-archive, accessibility-diagnostic, and
Storybook gates.

## Community and repository

| Path | Destination |
| --- | --- |
| Questions and discussion | [Cratis Discord](https://discord.gg/kt4AMpV8WV) |
| Bugs and feature requests | [GitHub Issues](https://github.com/Cratis/Components/issues) |
| Releases | [GitHub Releases](https://github.com/Cratis/Components/releases) |
| Contributing | [Cratis contribution guide](https://github.com/Cratis/.github/blob/main/contributing.md) |
| Security reports | [Private security reporting](mailto:oss@cratis.io?subject=Security%3A) |
| Source license | [`LICENSE`](./LICENSE) |
| Package notices | [`Source/THIRD_PARTY_NOTICES.md`](./Source/THIRD_PARTY_NOTICES.md) |

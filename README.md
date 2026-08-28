# Cratis Components

React components for CQRS and event-sourced applications built with
[Cratis Arc](https://github.com/Cratis/Arc) — command dialogs, typed forms,
query-backed data tables, and higher-order application surfaces.

This is the owning source repository for `@cratis/components`. The current
package uses Cratis-owned React markup, public TypeScript types, design tokens,
stable parts, and state attributes. React Aria is an internal implementation
dependency for selected interaction primitives.

[![NPM](https://img.shields.io/npm/v/@cratis/components?label=@cratis/components&logo=npm)](https://www.npmjs.com/package/@cratis/components)
[![Documentation site](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml/badge.svg)](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml)
[Documentation](https://cratis.io/components/)

## Start here

- [Browse the canonical Components documentation](https://cratis.io/components/)
- [Install and mount the provider](#minimal-setup)
- [Choose a component area](#what-components-owns)
- [Inspect the package source](https://github.com/Cratis/Components/tree/main/Source)

## What Components owns

| Area                 | Current package role                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| Command input        | Typed fields, embedded forms, dialogs, and multi-step command flows               |
| Data display         | Query-backed tables, local-array tables, list pages, filters, and detail surfaces |
| Application surfaces | Dialogs, notifications, dropdowns, display primitives, page chrome, and toolbars  |
| Structured editors   | JSON content, JSON Schema, navigation, canvas, pivot, and time-oriented views     |
| Styling boundary     | Cratis tokens, component styles, an optional baseline theme, and stable parts     |

## Relationship to Arc

Components consumes generated command and query contracts and React contexts
from Arc packages. Arc owns those application contracts; Components owns the
React markup, public component types, styling tokens, stable parts, and component
behavior in this repository.

Components carries the same design intent as the rest of Cratis: building on a CQRS or
event-sourced backend should feel like ordinary React. Typed commands, queries, and read models
remove friction and boilerplate from the UI layer. The ecosystem is designed for productivity,
quality, reliability, and AI-assisted development, with free [AI skills](https://github.com/Cratis/AI)
for building with the stack.

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

The package root is setup-only: import the provider and configuration helpers there, then import
every component from its explicit subpath. The built-in renderer needs no additional package or
configuration.

The current package manifest defines the exact React, Arc, Fundamentals, and
optional Pixi peer ranges. Verify those ranges before installing the package.

## Current boundaries

- The package manifest, exports, source, and migration guide define the current
  Components major-version surface.
- Generated compatibility schema v2 is checked in as [`compat-manifest.json`](./compat-manifest.json).
  It records the seven-package source-candidate scope and support windows; the durable
  [release policy](./release.md) explains why that metadata does not authorize publication.
- Workspace manifest versions in a source checkout are development inputs, not release
  identity. Publication is intentionally fail-closed while the Components 4 package set and
  trusted-publisher workflow are completed. Do not infer a release from a branch, tag, or local
  package version.
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

## The Cratis ecosystem

This project is part of [Cratis](https://www.cratis.io) — free, MIT-licensed tools for building
CQRS and event-sourced applications.

- **[Chronicle](https://github.com/Cratis/Chronicle)** — event-sourcing database and runtime with an
  Orleans-based kernel, pluggable storage, and language-agnostic gRPC contracts.
  [Documentation](https://www.cratis.io/chronicle/)
- **Chronicle clients** — first-class [.NET SDK](https://github.com/Cratis/Chronicle), plus
  [TypeScript](https://github.com/Cratis/Chronicle.TypeScript),
  [Kotlin/Java](https://github.com/Cratis/Chronicle.Kotlin), and
  [Elixir](https://github.com/Cratis/Chronicle.Elixir). AI agents connect through the
  [Chronicle MCP server](https://github.com/Cratis/Chronicle.Mcp).
- **[Arc](https://github.com/Cratis/Arc)** — CQRS framework for ASP.NET Core with commands, queries,
  validation, authorization, and TypeScript proxy generation. Arc does not require event sourcing.
  [Documentation](https://www.cratis.io/arc/)
- **Components** — this repository. [Documentation](https://www.cratis.io/components/)
- **[CLI](https://github.com/Cratis/cli) and Workbench** — inspect and diagnose Chronicle from the
  terminal or browser. [Documentation](https://www.cratis.io/cli/)
- **Supporting projects** — [Fundamentals](https://github.com/Cratis/Fundamentals),
  [Specifications](https://github.com/Cratis/Specifications),
  [Synopsis](https://github.com/Cratis/Synopsis), [Lens](https://github.com/Cratis/Lens), and
  [Narrator](https://github.com/Cratis/Narrator).
- **[Samples](https://github.com/Cratis/Samples)** — runnable event-sourcing and CQRS examples.

Release notes and announcements are published on the [Cratis blog](https://blog.cratis.io).

## Migration tooling

The repository ships `@cratis/components-codemods` and
`@cratis/eslint-plugin-components` for moving Components 3 root namespace imports to
explicit subpaths and preventing regressions afterward. The [migration guide](./Source/MIGRATION.md)
owns the bounded Components 4 codemod commands and stop cases; the [ESLint plugin
README](./ESLint/README.md) owns installation and flat-config composition. Components 3 has no
3.x codemod train. Use tooling in `>=4 <5` (for example the shell-safe `^4.0.0` range), never
`latest`. Codemod and ESLint patches release independently from Core; codemod preflight enforces
the bundled compatibility manifest and installed Components support window. Publication remains
fail closed under the repository [release policy](./release.md).

## Contributing

This is a framework-library repository. [Component source](https://github.com/Cratis/Components/tree/main/Source)
keeps public types, stories, and specifications near each component; export and
package verification lives under `Source/scripts/`.

For root and package README changes, verify the exact files explicitly:

```bash
npx markdownlint-cli2 README.md Source/README.md
npx linkinator README.md Source/README.md --markdown --recurse
```

Release-policy contributors can verify the deterministic contract, fail-closed workflow guards,
and source-candidate evidence generator without publishing anything:

```bash
yarn verify-compat-manifest
yarn verify-release-safety
yarn test-release-policy
yarn test-release-evidence
yarn test-renderer-adapter-matrix
yarn generate-release-evidence --output /absolute/path/to/empty/evidence-directory
```

The caller-provided evidence directory is temporary/untracked output. The hosted workflow retains
its source-candidate artifact for 30 days; that upload is not npm provenance and grants no
publication authority. Trusted-publisher provenance remains a separate future owner-authorized
publish-job requirement.

Source changes follow the repository's framework rules and the applicable build,
type, specification, export, package-archive, accessibility-diagnostic, and
Storybook gates. Renderer adapter contributors must also run the
[packed lower/current package-manager matrix](./scripts/renderer-adapter-matrix.md).

## Community and repository

Cratis is an open community, and we are glad to help users, teams evaluating the stack, and
contributors.

| Path                      | Destination                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Questions and discussion  | [Cratis Discord](https://discord.gg/kt4AMpV8WV)                                          |
| Bugs and feature requests | [GitHub Issues](https://github.com/Cratis/Components/issues)                             |
| Releases                  | [GitHub Releases](https://github.com/Cratis/Components/releases)                         |
| Contributing              | [Cratis contribution guide](https://github.com/Cratis/.github/blob/main/contributing.md) |
| Security reports          | [Private security reporting](mailto:oss@cratis.io?subject=Security%3A)                   |
| Source license            | [`LICENSE`](./LICENSE)                                                                   |
| Package notices           | [`Source/THIRD_PARTY_NOTICES.md`](./Source/THIRD_PARTY_NOTICES.md)                       |

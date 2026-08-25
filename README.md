# Cratis Components

Components is a React component library aligned with Arc application patterns.

This is the owning source repository for `@cratis/components`. The package provides command forms and dialogs, query-backed data tables, page compositions, notifications, editors, and shared application surfaces for frontends built with Cratis Arc.

[![NPM](https://img.shields.io/npm/v/@cratis/components?label=@cratis/components&logo=npm)](https://www.npmjs.com/package/@cratis/components)
[![Publish](https://github.com/Cratis/Components/actions/workflows/publish.yml/badge.svg)](https://github.com/Cratis/Components/actions/workflows/publish.yml)
[![Documentation](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml/badge.svg)](https://github.com/Cratis/Documentation/actions/workflows/docs-site.yml)

## Start here

- [Browse the canonical Components documentation](https://cratis.io/components/)
- [Install and mount the provider](#minimal-setup)
- [Choose a component area](#what-components-owns)
- [Inspect the package source](https://github.com/Cratis/Components/tree/main/Source)

## What Components owns

| Area | Use it for |
| --- | --- |
| Command input | Typed command fields, embedded forms, single-step dialogs, and multi-step command flows |
| Data display | Query-backed tables, local-array tables, list pages, filters, and detail surfaces |
| Application surfaces | Dialogs, notifications, dropdowns, display primitives, page chrome, and toolbars |
| Structured editors | JSON content, JSON Schema, navigation, canvas, pivot, and time-oriented views |
| Styling boundary | Cratis tokens, component styles, a baseline theme, and pass-through hooks for application styling |

The table above maps common screen jobs to the smallest current component area.

## Relationship to Arc

Components is built for Arc application frontends. Its command and query compositions consume Arc's generated TypeScript proxies and React contexts; the package manifest declares Arc packages as peer dependencies.

That boundary is intentional:

- **Arc packages** provide the generated command and query contracts and React contexts consumed here.
- **Components** owns the React compositions that render and execute those contracts.
- Applications still choose their own screen composition, styling, accessibility verification, and browser support profile.

Components is not evidence of a complete design system, accessibility conformance, or browser coverage for an application. Verify those properties in the exact application and component profile you ship.

## Minimal setup

Install the package and its required rendering peers:

```bash
npm install @cratis/components primereact @primereact/core @primereact/headless @primereact/hooks primeicons
```

Import the token and component styles once, then mount the provider around the application:

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';

export const App = () => (
    <CratisComponentsProvider value={{ license: 'YOUR-PRIMEUI-LICENSE-KEY' }}>
        <YourApp />
    </CratisComponentsProvider>
);
```

The [canonical Components page](https://cratis.io/components/) carries the currently admitted documentation profile. Replace the placeholder with a key supplied through your application's approved secret/configuration boundary; do not commit it to source.

## Documentation map

- [Canonical Components documentation](https://cratis.io/components/)
- [Product-owned documentation source](https://github.com/Cratis/Components/tree/main/Documentation)
- [Package-level requirements and licensing notes](./Source/README.md)

The canonical documentation is maintained in this repository under [`Documentation/`](https://github.com/Cratis/Components/tree/main/Documentation) and rendered on cratis.io by the Documentation repository.

## Contributing

This is a framework-library repository. [Component source](https://github.com/Cratis/Components/tree/main/Source) keeps public types, stories, and specifications near each component; export and package verification lives under `Source/scripts/`.

For root and package README changes, verify the exact files explicitly:

```bash
npx markdownlint-cli2 README.md Source/README.md
npx linkinator README.md Source/README.md --markdown --recurse
```

For product documentation under `Documentation/`, run its repository verification:

```bash
cd Documentation
./verify-markdown.sh
```

Source changes follow the repository's framework contribution rules and the applicable build, type, specification, export, and Storybook gates.

## Community and repository

| Path | Destination |
| --- | --- |
| Questions and discussion | [Cratis Discord](https://discord.gg/kt4AMpV8WV) |
| Bugs and feature requests | [GitHub Issues](https://github.com/Cratis/Components/issues) |
| Releases | [GitHub Releases](https://github.com/Cratis/Components/releases) |
| Contributing | [Cratis contribution guide](https://github.com/Cratis/.github/blob/main/contributing.md) |
| Security reports | [Private security reporting](mailto:oss@cratis.io?subject=Security%3A) |
| Source license | [`LICENSE`](./LICENSE) |

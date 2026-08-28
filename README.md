# Cratis Components

React components for CQRS and event-sourced applications built with [Cratis Arc](https://github.com/Cratis/Arc) — command dialogs, typed forms, and query-backed data tables.

## Packages

[![NPM](https://img.shields.io/npm/v/@cratis/components?label=@cratis/components&logo=npm)](https://www.npmjs.com/package/@cratis/components)

## Builds

[![Publish](https://github.com/Cratis/Components/actions/workflows/publish.yml/badge.svg)](https://github.com/Cratis/Components/actions/workflows/publish.yml)
[![Documentation site](https://github.com/Cratis/Documentation/actions/workflows/pages.yml/badge.svg)](https://github.com/Cratis/Documentation/actions/workflows/pages.yml)

## Description

Cratis Components is a React component library aligned with the patterns of [Arc](https://github.com/Cratis/Arc), the Cratis CQRS application framework for ASP.NET Core. The components consume Arc's generated TypeScript proxies, so commands, queries, and read models flow fully typed from your backend into the UI — including event-sourced applications backed by [Chronicle](https://github.com/Cratis/Chronicle), the Cratis event-sourcing database and runtime.

The library builds on PrimeReact and ships with flexible styling: use the Cratis baseline theme, PrimeReact's styled mode, your own palette, or go fully unstyled with a `pt` preset.

Components carries the same design intent as the rest of Cratis: building on an event-sourced backend should feel like ordinary React, with typed commands, queries, and read models designed to take friction and boilerplate out of the UI layer. It is part of one deliberately simple ecosystem, built with productivity, quality, and reliability in mind — AI-friendly by design, with free [AI skills](https://github.com/Cratis/AI) for building with the stack.

`@cratis/components` itself is MIT licensed. Version 3.x builds on PrimeReact 11, which carries its own license terms — see the [licensing section in the package README](./Source/README.md#licensing) for details.

## Install

```bash
npm install @cratis/components primereact @primereact/core @primereact/headless @primereact/hooks primeicons
```

```tsx
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { CratisComponentsProvider } from '@cratis/components';
import { DataPage } from '@cratis/components/DataPage';

export const App = () => (
    <CratisComponentsProvider>
        <YourApp />
    </CratisComponentsProvider>
);
```

See the [package README](./Source/README.md) for peer dependencies, stylesheets, and styling setups, and the [getting started guide](https://www.cratis.io/components/getting-started/) for a full walkthrough.

## What's in the box

| Component | What it does |
|---|---|
| `CommandDialog` / `CommandStepper` | Instantiates, validates, and executes a generated Arc command — single-step or multi-step |
| `CommandForm` | Typed input fields bound to command properties — text, number, dropdown, date, and more |
| `DataPage` | A resizable page that lists query data with toolbar actions and detail panels |
| `DataTables` | Data-table wrappers that render an Arc query or observable query, with filtering and paging |
| `Dialogs` | Data-collection dialogs that return values without executing a command |
| `Chat` | Topic-based chat with host-supplied data, mentions, emoji, and per-message actions |
| `SchemaEditor` | Edit JSON schemas visually |
| `TimeMachine` | Navigate state over time — a natural fit for event-sourced read models |
| `PivotViewer` | Explore collections across multiple dimensions |
| `Notifications`, `Toolbar`, `Dropdown`, `Display`, … | Supporting building blocks — see the [full export list](./Source/README.md#available-subpath-exports) |

## The Cratis ecosystem

This project is part of [Cratis](https://www.cratis.io) — free, MIT-licensed tools for building event-sourced and CQRS applications.

- **[Chronicle](https://github.com/Cratis/Chronicle)** — event-sourcing database and runtime. Orleans-based kernel, pluggable storage (MongoDB default; PostgreSQL, SQL Server, SQLite, in-memory), language-agnostic gRPC contracts. [Docs](https://www.cratis.io/chronicle/)
- **Chronicle clients** — first-class [.NET SDK](https://github.com/Cratis/Chronicle), plus [TypeScript](https://github.com/Cratis/Chronicle.TypeScript), [Kotlin/Java](https://github.com/Cratis/Chronicle.Kotlin), and [Elixir](https://github.com/Cratis/Chronicle.Elixir); [Python](https://github.com/Cratis/Chronicle.Python) coming soon (pre-alpha). AI agents connect through the [Chronicle MCP server](https://github.com/Cratis/Chronicle.Mcp).
- **[Arc](https://github.com/Cratis/Arc)** — opinionated CQRS framework for ASP.NET Core with commands, queries, validation, authorization, and TypeScript proxy generation. Works without event sourcing. [Docs](https://www.cratis.io/arc/)
- **Components** — this repository. [Docs](https://www.cratis.io/components/)
- **[CLI](https://github.com/Cratis/cli) + Workbench** — inspect and diagnose Chronicle from the terminal or the browser. [Docs](https://www.cratis.io/cli/)
- **Supporting** — [Fundamentals](https://github.com/Cratis/Fundamentals), [Specifications](https://github.com/Cratis/Specifications), [Synopsis](https://github.com/Cratis/Synopsis), [Lens](https://github.com/Cratis/Lens), [Narrator](https://github.com/Cratis/Narrator)
- **[Samples](https://github.com/Cratis/Samples)** — runnable event sourcing and CQRS samples for the whole stack

Blog: [blog.cratis.io](https://blog.cratis.io)

## Support

Cratis is an open community, and we are glad to help users, teams evaluating the stack, and contributors.

| Channel | Details |
|---|---|
| Discord | Join the community on [Discord](https://discord.gg/kt4AMpV8WV) for questions and discussions |
| GitHub Issues | [Report bugs or request features](https://github.com/Cratis/Components/issues) |
| Documentation | Read the docs at [cratis.io](https://cratis.io) |

Release notes and announcements: the [Cratis blog](https://blog.cratis.io).

---
title: Why Components
description: Why Components owns React composition around Arc proxies and selected interaction primitives.
---

You can connect an Arc-generated command or query to any React UI. Without Components, every application repeatedly builds command execution state, validation display, dialogs, observable subscriptions, paging, selection, empty/pending states, localization, and accessibility behavior.

As the React UI component of **Cratis Platform**, Components centralizes that integration behind Components-owned APIs and documented package subpaths. Arc owns command/query execution and generated contracts; Components owns how the React screen collects input and presents results. Chronicle can supply event-sourced storage behind Arc, but it is not required.

## What it removes

| Without Components                                                         | With Components                                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Instantiate a command, track execution, disable actions, render validation | `<CommandDialog command={...}>` owns the lifecycle                            |
| Bind each field manually                                                   | `<InputTextField value={command => command.name} />`                          |
| Subscribe to query changes and manage pending/empty state                  | Query-backed Components own the result lifecycle                              |
| Hand-roll list pages, selection, paging, and detail panels                 | `<DataPage>` composes the screen                                              |
| Reimplement focus, overlays, keyboard interaction, and international dates | Components delegates selected low-level primitives to React Aria and exercises the composed behavior in owning specs |

## What Components owns

- Public React component APIs and event types
- Arc command/query/dialog integration
- Semantic markup plus documented ARIA, focus, and keyboard behavior
- Stable `data-cratis-part` names and state attributes
- `--cratis-*` design tokens and structural styles
- Product-level behavior specs and current migration mappings

React Aria is an internal implementation dependency. Consumers do not type against it or style its internal DOM.

## Custom styling remains product-owned

Import the optional baseline theme, or omit it and map product tokens directly onto `--cratis-*`. Documented customizable parts use stable Cratis part names, and components that expose `pt` accept ordinary HTML attributes for those documented parts.

This avoids coupling a product design system to a renderer preset, proprietary provider, or internal class roster.

## When to use it

Use Components for Cratis application surfaces that consume generated commands, queries, dialogs, forms, tables, notifications, or shared interaction patterns.

Use native HTML or a product-owned presentational component for a one-off element that has no Cratis behavior. The two approaches compose naturally because Components uses semantic HTML and consumer-owned CSS. For a proposed new generic primitive, see the [generic primitive admission decision](decisions/0005-generic-primitive-admission.md): show reuse and a Components-owned interaction contract or a need from an established Components contract. Markup and tokens alone do not qualify.

## Decide whether this fits your screen

For a list with add/edit actions, use a query-backed table or `DataPage` with `CommandDialog`. Start with [Choosing a component](choosing-a-component.md), then follow [Getting started](getting-started.mdx) and the [library tutorial](tutorial/index.md). You bring the running backend and generated proxies; the tutorial names the exact files and identifiers it uses.

For already-loaded rows or controlled local UI state, use local-data surfaces without inventing a command or backend. Those surfaces do not need to execute Arc requests, although Arc remains a required package peer. Applications may also use Arc with another UI library.

Components removes repeated subscription and execution UI code, not application decisions. You still choose query scope, pass selected ids, handle backend failures, and check labels, focus, contrast, and layout in your application. Command success is not a guarantee that a separate read model is already current. See [Displaying data](displaying-data.md) for that boundary.

## Why the foundation changed

Components 3 used PrimeReact as a declared package foundation. Components 4 does not declare PrimeReact, PrimeIcons, PrimeUI, or PrimeUI themes as dependencies or peers; it replaces those package and renderer contracts with Components-owned markup, types, tokens, and documented parts. Applications retaining direct third-party imports keep their own package and license boundaries.

Read [UI foundation](ui-foundation.md) for the decision and [Migrate from Components 3](Migration/3-to-4.md) for the consumer steps.

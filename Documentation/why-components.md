---
title: Why use Cratis Components for Arc-backed React screens?
description: Cratis Components connects React forms and tables to Cratis Arc proxies, handling validation, execution state, and query results while you own styling.
---

Cratis Components supplies React forms, dialogs, and tables that work with Cratis Arc's generated commands and queries. These TypeScript classes let the browser call your backend. For an add-author dialog, you provide the command and name field; `CommandDialog` binds the input, controls confirmation through command validation, and tracks execution. For a list, a query-backed table handles subscriptions, paging, and loading or empty results. You write the fields, columns, and actions that make the screen yours.

Components is part of **Cratis Platform**, but you can adopt it with Arc without the rest of the stack. Arc owns command/query execution and generated contracts; Components owns how the React screen collects input and presents results. Cratis Chronicle can supply event-sourced storage behind Arc, but it is not required.

## What it removes

| Without Components                                                         | With Components                                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Instantiate a command, track execution, disable actions, render validation | `<CommandDialog command={...}>` owns the lifecycle                            |
| Bind each field manually                                                   | `<InputTextField value={command => command.name} />`                          |
| Subscribe to query changes and manage pending/empty state                  | Query-backed Components own the result lifecycle                              |
| Hand-roll list pages, selection, paging, and detail panels                 | `<DataPage>` composes the screen                                              |
| Reimplement focus, overlays, keyboard interaction, and international dates | Components delegates selected low-level primitives to React Aria and exercises the composed behavior in owning specs |

## What Components owns

Your application uses Cratis-owned React APIs and event types for command, query, and dialog integration. Components owns the semantic markup and documented ARIA, focus, and keyboard behavior, with product-level behavior specs and migration mappings in this repository.

For styling, Components exposes `--cratis-*` design tokens, structural styles, and stable `data-cratis-part` names and state attributes. React Aria is an internal implementation dependency; your application does not type against it or style its internal DOM.

## Custom styling remains product-owned

Import the optional baseline theme, or omit it and map product tokens directly onto `--cratis-*`. Documented customizable parts use stable Cratis part names, and components that expose `pt` accept ordinary HTML attributes for those documented parts.

This avoids coupling a product design system to a renderer preset, proprietary provider, or internal class roster.

## When to use it

Use Components for Cratis application surfaces that consume generated commands, queries, dialogs, forms, tables, notifications, or shared interaction patterns.

Use native HTML or a product-owned presentational component for a one-off element that has no Cratis behavior. The two approaches compose naturally because Components uses semantic HTML and consumer-owned CSS. For a proposed new generic primitive, see the [generic primitive admission decision](decisions/0005-generic-primitive-admission.md): show reuse and a Components-owned interaction contract or a need from an established Components contract. Markup and tokens alone do not qualify.

## Decide whether this fits your screen

For a list with add/edit actions, combine a query-backed table or `DataPage` with `CommandDialog`. [Getting started](getting-started.mdx) gets the first dialog on screen; the [library tutorial](tutorial/index.md) adds the author list and selected author's books. You bring the running backend and generated proxies, and the tutorial names the files and identifiers it uses. If you are fitting Components into an existing screen, start with [Choosing a component](choosing-a-component.md) to find the smaller composition you need.

For already-loaded rows or controlled local UI state, use local-data surfaces without inventing a command or backend. Those surfaces do not need to execute Arc requests, although Arc remains a required package peer. Applications may also use Arc with another UI library.

Components removes repeated subscription and execution UI code, not application decisions. You still choose query scope, pass selected ids, handle backend failures, and check labels, focus, contrast, and layout in your application.

:::caution[Command success and read-model updates are separate]
Command success is not a guarantee that a separate read model, the data a query reads, is already current. Check the query result before assuming the screen includes a completed write. See [Displaying data](displaying-data.md) for that boundary.
:::

## Why the foundation changed

Components 3 used PrimeReact as a declared package foundation. Components 4 does not declare PrimeReact, PrimeIcons, PrimeUI, or PrimeUI themes as dependencies or peers; it replaces those package and renderer contracts with Components-owned markup, types, tokens, and documented parts. Applications retaining direct third-party imports keep their own package and license boundaries.

Read [UI foundation](ui-foundation.md) for the decision and [Migrate from Components 3](Migration/3-to-4.md) for the consumer steps.

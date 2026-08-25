---
title: Why Components
description: Why Cratis owns a component system around Arc proxies and accessible interaction behavior.
sidebar:
    order: 1
---

You can connect an Arc-generated command or query to any React UI. Without Components, every application repeatedly builds command execution state, validation display, dialogs, observable subscriptions, paging, selection, empty/pending states, localization, and accessibility behavior.

Components centralizes that integration behind a stable Cratis-owned API.

## What it removes

| Without Components                                                         | With Components                                                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Instantiate a command, track execution, disable actions, render validation | `<CommandDialog command={...}>` owns the lifecycle                            |
| Bind each field manually                                                   | `<InputTextField value={command => command.name} />`                          |
| Subscribe to query changes and manage pending/empty state                  | Query-backed Components own the result lifecycle                              |
| Hand-roll list pages, selection, paging, and detail panels                 | `<DataPage>` composes the screen                                              |
| Reimplement focus, overlays, keyboard interaction, and international dates | Components delegates low-level behavior to React Aria and verifies the result |

## What Components owns

- Public React component APIs and event types
- Arc command/query/dialog integration
- Semantic markup and accessibility composition
- Stable `data-cratis-part` names and state attributes
- `--cratis-*` design tokens and structural styles
- Product-level behavior specs and migration guarantees

React Aria is an internal implementation dependency. Consumers do not type against it or style its internal DOM.

## Custom design systems remain first-class

Import the baseline theme for a ready-made appearance, or omit it and map product tokens directly onto `--cratis-*`. Every meaningful element has a stable Cratis part, and `pt` accepts ordinary HTML attributes for per-instance customization.

This avoids coupling a product design system to a renderer preset, proprietary provider, or internal class roster.

## When to use it

Use Components for Cratis application surfaces that consume generated commands, queries, dialogs, forms, tables, notifications, or shared interaction patterns.

Use native HTML or a product-owned presentational component for a one-off element that has no Cratis behavior. The two approaches compose naturally because Components uses semantic HTML and consumer-owned CSS.

## Why the foundation changed

Components 3 was backed by PrimeReact 11. PrimeUI licensing still applied through wrappers, renderer types leaked into declarations, and custom products depended on renderer-specific pass-through slots. Components 4 replaces that mandatory foundation with Cratis-owned contracts and open interaction dependencies.

Read [UI foundation](ui-foundation.md) for the decision and [Migrate from Components 3](migration.md) for the consumer steps.

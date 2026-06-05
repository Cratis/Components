---
title: Why Components
description: What the Cratis Components library is for, and why it exists on top of PrimeReact.
sidebar:
  order: 1
---

You can build your UI straight on PrimeReact (or any component kit) and keep each form and table connected to your [Arc](/arc/) backend with screen-local state and effects — instantiate the command, manage loading and error state, render the footer buttons, bind each field, call the query, handle the observable subscription. Components centralizes that wiring.

It's a set of React components built on **PrimeReact** that know how to talk to **Arc's generated proxies**. The result: a command form or a live data table is a few declarative lines instead of a few files of glue.

## What it removes

| Without Components | With Components |
|---|---|
| Instantiate a command, track `isExecuting`, disable the button, render OK/Cancel | `<CommandDialog command={...}>` does all of it |
| Bind each input to command state and validate locally | `<InputTextField value={i => i.name} />` — typed to the command |
| Fetch a query, subscribe to the observable, re-render on change | `<DataTableForObservableQuery>` / `query.use()` |
| Hand-roll list pages with detail panels | `<DataPage>` |

## What you get

- **Command components** — `CommandDialog`, `StepperCommandDialog`, and the full `CommandForm` field set (text, number, dropdown, date, checkbox, slider, …), all typed against your generated command.
- **Data components** — `DataTableForQuery`, `DataTableForObservableQuery`, and `DataPage` for list-and-detail screens.
- **Building blocks** — dialogs, toolbars, navigation, and specialized editors (`PivotViewer`, `TimeMachine`, `SchemaEditor`).
- **Theming that stays out of the way** — use a PrimeReact theme, repaint with a custom palette, or go fully unstyled. See [Styling](/components/styling/).

## When to use it

Use Components when you're building a Cratis app and want the UI to track the backend with minimal ceremony. If you only need one-off presentational widgets unrelated to commands/queries, plain PrimeReact is fine — and the two coexist happily.

## Next

- [Getting started](/components/getting-started/) — install, wire the provider, render your first form and table.
- [Build a full-stack feature](/build-a-full-app/) — see Components consume a real Arc slice end to end.

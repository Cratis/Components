# Styling

Cratis Components is built on top of PrimeReact and stays out of your way when it comes to styling. You can use the look that PrimeReact gives you out of the box, keep PrimeReact's structure while applying your own palette, or take complete control and provide every visual yourself — all without forking the library or fighting it.

There are three supported styling options. They are not mutually exclusive: every component still exposes the same building blocks, so you can combine them per-component or per-region of your app.

## TL;DR — choose a styling setup

| Setup | When | Effort | What you write |
|---|---|---|---|
| [**Use a PrimeReact theme**](themed.md) | You want components to look good immediately and tweak from there. | Lowest | Theme CSS import + provider |
| [**Use a custom palette on top of a PrimeReact theme**](custom-palette.md) | You want PrimeReact's structure but your own colors. | Low | A PrimeReact theme + CSS variable overrides |
| [**Use fully unstyled mode**](unstyled.md) | You're integrating into a tightly controlled design system. | Highest | `unstyled: true` + a `pt` preset in CSS or Tailwind |

All three setups use the same one-line setup described in [Getting Started](getting-started.md). You can change direction later because the same provider, tokens, and `pt` hooks stay available.

## Why the first two options still load a PrimeReact theme

In PrimeReact 10 every widget's *structural* CSS — padding, borders, dialog frame, focus rings, button shapes — ships **inside the theme file**. There is no separate primitives stylesheet. So a setup without any PrimeReact theme has no widget chrome at all and components render as the raw HTML primitives the browser supplies by default. PrimeReact 11's styled mode (`@primeuix/themes`) works the same way — the active preset supplies the chrome — so the reasoning here is unchanged across versions.

The `--cratis-*` token layer is an additive Cratis-scoped tint for surfaces the wrappers in this package own — validation error text, the FormElement addon background, breadcrumb borders — and **is not, by itself, sufficient to skin PrimeReact widgets**. Override PrimeReact's variables when you want the whole UI in your palette. Use `unstyled: true` and a `pt` preset when you want to replace PrimeReact's visuals entirely.

The token layer is **version-spanning**: each `--cratis-*` token resolves the PrimeReact v11 design token (`@primeuix/themes`) first and falls back to the v10 theme variable, so the same build of this package is themed correctly whether your app is on PrimeReact 10 or 11. (Note: this covers the *theming* surface only — full PrimeReact 11 component/`pt`-slot compatibility is tracked separately.)

## Mental model

Every component you import from `@cratis/components` is a thin wrapper around a PrimeReact component plus a few Cratis additions (validation hooks, command-form integration, …). Styling flows in three layers:

1. **PrimeReact theme tokens** — on v10 the theme variables `--surface-card`, `--text-color`, `--primary-color`, …; on v11 the `@primeuix/themes` design tokens (`--p-*`, customized via `definePreset`). Read directly by PrimeReact widgets. Override these to repaint the whole UI.
2. **Cratis tokens** — `--cratis-surface-card`, `--cratis-text-color`, `--cratis-primary-color`, … Read only by Cratis-scoped surfaces. In `tokens.css` each resolves the PrimeReact v11 design token (e.g. `--p-content-border-color`) first and falls back to the v10 theme variable (e.g. `--surface-border`), so they stay in sync with the loaded PrimeReact theme on either major. Override these when you want a Cratis surface tinted differently from the surrounding PrimeReact widgets.
3. **PrimeReact `pt` (pass-through)** — A per-component prop that lets you attach CSS class names (or inline styles) to every slot inside a PrimeReact widget. The strongest customization knob; works hand-in-hand with `unstyled` mode.

The [Cratis token reference](cratis-tokens.md) lists every token and the surface it tints. The [pass-through cheat sheet](pass-through.md) lists every Cratis wrapper and which pt props it exposes.

## See also

- [Getting Started](getting-started.md) — the one-line setup every option shares
- [Use a PrimeReact theme](themed.md)
- [Use a custom palette on top of a PrimeReact theme](custom-palette.md)
- [Use fully unstyled mode](unstyled.md)
- [Cratis token reference](cratis-tokens.md)
- [Pass-through (pt) cheat sheet](pass-through.md)
- [Combining styling setups](mixing-paths.md)
- [CratisComponentsProvider](../Common/cratis-components-provider.md)

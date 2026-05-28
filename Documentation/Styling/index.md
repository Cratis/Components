# Styling

Cratis Components is built on top of PrimeReact and stays out of your way when it comes to styling. You can ship the look that PrimeReact gives you out of the box, repaint the whole UI in your own palette, or take complete control and bring your own visuals from scratch — all without forking the library or fighting it.

There are three documented paths. They are not mutually exclusive: every component still exposes the same building blocks, so you can mix them per-component or per-region of your app.

## TL;DR — pick a path

| Path | When | Effort | What you write |
|---|---|---|---|
| [**A. PrimeReact-themed**](themed.md) | You want it to look good immediately and tweak from there. | Lowest | One CSS import + provider |
| [**B. Custom palette**](custom-palette.md) | You want PrimeReact's chrome but in your own colors. | Low | A PrimeReact theme + a small CSS override block |
| [**C. Fully unstyled**](unstyled.md) | You're integrating into a tightly-controlled design system. | Highest | A `pt` preset (in CSS or Tailwind) |

All three paths use the same one-line setup described in [Getting Started](getting-started.md). They remain switchable later — you won't repaint yourself into a corner.

## Why a PrimeReact theme is still in Paths A and B

In PrimeReact 10 every widget's *structural* CSS — padding, borders, dialog frame, focus rings, button shapes — ships **inside the theme file**. There is no separate primitives stylesheet. So a setup without any PrimeReact theme has no widget chrome at all and components render as the raw HTML primitives the browser supplies by default.

The `--cratis-*` token layer is an additive Cratis-scoped tint for surfaces the wrappers in this package own — validation error text, the FormElement addon background, breadcrumb borders — and **is not, by itself, sufficient to skin PrimeReact widgets**. Use Path B if you want a custom palette on top of PrimeReact's chrome, and Path C if you want to ditch PrimeReact's chrome entirely.

## Mental model

Every component you import from `@cratis/components` is a thin wrapper around a PrimeReact component plus a few Cratis additions (validation hooks, command-form integration, …). Styling flows in three layers:

1. **PrimeReact theme variables** — `--surface-card`, `--text-color`, `--primary-color`, … Read directly by PrimeReact widgets. Override these to repaint the whole UI.
2. **Cratis tokens** — `--cratis-surface-card`, `--cratis-text-color`, `--cratis-primary-color`, … Read only by Cratis-scoped surfaces. Default to the matching PrimeReact variable via cascade in `tokens.css`. Override these when you want a Cratis surface tinted differently from the surrounding PrimeReact widgets.
3. **PrimeReact `pt` (pass-through)** — A per-component prop that lets you attach CSS class names (or inline styles) to every slot inside a PrimeReact widget. The strongest customization knob; works hand-in-hand with `unstyled` mode.

The [Cratis token reference](cratis-tokens.md) lists every token and the surface it tints. The [pass-through cheat sheet](pass-through.md) lists every Cratis wrapper and which pt props it exposes.

## See also

- [Getting Started](getting-started.md) — the one-line setup every path shares
- [Path A — PrimeReact-themed](themed.md)
- [Path B — Custom palette](custom-palette.md)
- [Path C — Fully unstyled](unstyled.md)
- [Cratis token reference](cratis-tokens.md)
- [Pass-through (pt) cheat sheet](pass-through.md)
- [Mixing paths](mixing-paths.md)
- [CratisComponentsProvider](../Common/cratis-components-provider.md)

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# `@cratis/components.designsystemet`

[Digdir Designsystemet](https://designsystemet.no) adapter for the nine stable presentation slots in
the Cratis Components renderer ABI v1. It exports one stable `CratisPresentationUiLibrary` manifest,
`designsystemetUiLibrary`. It also implements the stable `dialogs.dialog` atomic slot as a native
modal `<dialog>`. This certifies nine-slot primitive adaptation and the dialog shell, never
full-catalog replacement.

> **Versions:** each release of `@cratis/components.designsystemet` is published at the same version
> as `@cratis/components` and declares a peer on exactly that version. Install and upgrade the two
> together.

## Install

```bash
npm install @cratis/components.designsystemet@^4 @cratis/components@^4 \
  @digdir/designsystemet-react@^1.24 @digdir/designsystemet-css@^1.24 react@^19 react-dom@^19
```

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { designsystemetUiLibrary } from '@cratis/components.designsystemet';

<CratisComponentsProvider value={{ locale: 'en-US' }} library={designsystemetUiLibrary}>
    <Application />
</CratisComponentsProvider>
```

Components that execute commands or run queries also need Arc's `<Arc>` provider from
`@cratis/arc.react`.

## Styling

The adapter does not bundle or import any CSS. Import the Designsystemet stylesheet and a
Designsystemet theme in the application, before the Cratis stylesheets:

```ts
import '@digdir/designsystemet-css';
import './my-designsystemet-theme.css';
import '@cratis/components/tokens';
import '@cratis/components/styles';
```

The Cratis token bridge that maps Designsystemet tokens onto the Cratis tokens ships with #529; until
it lands, Cratis-owned components keep their built-in token values. Set `data-color-scheme` and
`data-size` on a container to drive the Designsystemet color scheme and size mode.

## Slot mapping

| Slot | Designsystemet | Fidelity | Notes |
| --- | --- | --- | --- |
| `common.button` | `Button` (+ `Spinner`); tooltip rendered by Cratis' own `Tooltip` (hover + keyboard focus, `aria-describedby`, `tooltipOptions` honoured), not the upstream `data-tooltip` script | native; `link` variant approximated as `tertiary` | `solid`→`primary`, `outline`→`secondary`, `ghost`/`link`→`tertiary`; tone→`data-color`; size `small`/`large`→`data-size` `sm`/`lg`, `normal` leaves the size unset |
| `common.iconButton` | `Button icon` | native | same mapping; defaults to the pill shape |
| `common.textInput` | `Input` | native | the input is the `root` part |
| `common.textArea` | `Textarea` | native | the textarea is the `root` part |
| `common.checkbox` | `Field` + `Input` + `Label` | native | `box` and `indicator` are hidden structural hooks |
| `common.radio` | `Field` + `Input` + `Label` | native | `box` and `indicator` are hidden structural hooks |
| `common.switch` | `Field` + `Input role=switch` + `Label` | native | `control` and `handle` are hidden structural hooks |
| `common.progress` | token-styled track / `Spinner` | native | Designsystemet has no progress bar; indeterminate uses `Spinner` |
| `common.surface` | `ds-card` class on the element (upstream `Card` is not mounted: it delegates body clicks to a heading link) | native | rendered on the requested `article`/`div`/`section` |

Designsystemet paints the checkbox, radio and switch on the native input, so the Cratis `box`,
`indicator`, `control` and `handle` parts exist for the part contract but carry no visuals. The `link`
button variant has no Designsystemet counterpart and renders as `tertiary`.

### Attribute policy

Designsystemet reads `data-size` as an inherited size mode and `data-variant`/`data-color` as its own
appearance vocabulary. The adapter therefore never forwards the Cratis values (`small|normal|large`,
`solid|outline|ghost|link`) in those attributes. The Cratis variant is exposed as
`data-cratis-variant`.

## Not covered

- The dialog (`dialogs.dialog`) renders the Designsystemet `Dialog` as a native modal `<dialog>` in
  the browser top layer. The browser owns the focus trap, Escape, outside press and focus restoration;
  Components keeps the result flow, the footer and header actions, busy state, initial focus and the
  dialog stack. Dropdowns, date pickers and tooltips inside the dialog portal into it, so they stay
  on top. See [ADR 0008](https://github.com/Cratis/Components/blob/main/Documentation/decisions/0008-adapter-owned-dialog-shell.md).
- The stable atomic `common.numberInput` slot renders number fields with the Designsystemet input.
- The other atomic slots (paginator, tooltip, select and date picker) use the built-in implementation.
- CommandForm fields (#527), the dialog footer (#528) and the theme bridge (#529) are separate work.

## Peer policy

`@digdir/designsystemet-react` and `@digdir/designsystemet-css` are bounded to `>=1.24 <2`, React and
ReactDOM to React 19. Vendor packages are peers; exact current versions remain dev dependencies only.

The source manifest declares `@cratis/components >=4 <5`. The release step replaces that range with
the exact release version, so a published adapter requires the `@cratis/components` release it
shipped with.

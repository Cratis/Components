<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# `@cratis/components.mui`

Material UI adapter for the nine stable presentation slots in the Cratis Components renderer ABI v1.
The package is independently versioned and exports one manifest, `muiUiLibrary`.

## Install

```sh
npm install @cratis/components.mui @cratis/components @mui/material @emotion/react @emotion/styled react react-dom
```

Select the adapter on the application Components provider:

```tsx
import { CratisComponentsProvider } from '@cratis/components';
import { muiUiLibrary } from '@cratis/components.mui';

export const Application = () => (
    <CratisComponentsProvider value={{ locale: 'en-US' }} library={muiUiLibrary}>
        <main>Application content</main>
    </CratisComponentsProvider>
);
```

The adapter covers Button, IconButton, TextInput, TextArea, Checkbox, Radio, Switch,
ProgressBar, and Surface. It deliberately excludes MUI X and does not implement the five atomic
interaction slots.

## Theme integration

The manifest provider mounts the MUI `ThemeProvider`. An outer CSS-variable MUI theme is reused.
An outer non-variable theme is converted to an equivalent CSS-variable theme so its palette and
other values remain in force. Without an outer provider, MUI's default theme becomes a sane
CSS-variable-enabled theme. The conversion is memoized and deterministic during server rendering.

Put application customization outside `CratisComponentsProvider`:

```tsx
<ThemeProvider theme={applicationTheme}>
    <CratisComponentsProvider value={{ locale: 'en-US' }} library={muiUiLibrary}>
        <Application />
    </CratisComponentsProvider>
</ThemeProvider>
```

The renderer provider ABI receives only `children` and non-secret boolean setup attestations; it
cannot receive an Emotion cache. SSR hosts
must create an Emotion cache per request, mount Emotion's `CacheProvider` outside the Components
provider, and extract critical styles from that same request-local cache. Sharing a cache between
requests can leak styles and ordering. RTL additionally requires the host MUI theme direction and
an Emotion cache configured with the RTL Stylis plugin. These are application/host integration
concerns and do not justify a Core ABI change.

## Peer policy

MUI Core is bounded to `>=9 <10`, Emotion to `>=11 <12`, and React/ReactDOM to React 19. Vendor
packages are peers; exact current versions are dev dependencies only for repository proof.

The current `@cratis/components` peer `>=3.0.0 <4` is a temporary repository placeholder matching
`@cratis/components.conformance` while the V4 source package is prepared. **It must be changed to
the honest `>=4 <5` range before this adapter is published.** Publishing with the placeholder would
misstate compatibility.

See [CONFORMANCE.md](./CONFORMANCE.md) for the bounded evidence and
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for upstream licenses.

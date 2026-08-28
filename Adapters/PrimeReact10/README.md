<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# `@cratis/components.primereact10`

PrimeReact 10 adapter for the nine stable presentation slots in the Cratis Components renderer ABI
v1. The package is independently versioned and exports one manifest,
`primeReact10UiLibrary`.

PrimeReact 11 uses a different package architecture and license boundary. It is supported separately
by `@cratis/components.primereact`; the two adapters must use isolated upstream dependency graphs.

## Install

```sh
npm install @cratis/components.primereact10 @cratis/components \
  primereact@^10.9.9 react@^19 react-dom@^19
```

The adapter covers Button, IconButton, TextInput, TextArea, Checkbox, Radio, Switch, ProgressBar,
and Surface. The five atomic interaction slots are not part of this profile and continue through the
Components built-in fallback.

PrimeReact 10 is MIT licensed and requires no PrimeUI key or Components renderer setup attestation.
Version 10.9.9 is the minimum supported upstream because it fixes the prototype-pollution advisory
that affects PrimeReact releases through 10.9.8.

## Theme and global configuration

PrimeReact 10 styled components require one application-selected theme stylesheet. Import it once in
the application entry point before application overrides:

```ts
import 'primereact/resources/themes/lara-light-cyan/theme.css';
```

The distributed theme is precompiled CSS and does not require Sass. Sass is needed only when an
application chooses to compile a custom PrimeReact 10 theme. PrimeIcons is optional; install and
import `primeicons/primeicons.css` only if the application uses PrimeIcons directly.

An outer `PrimeReactProvider` is optional. The adapter creates a default provider only when the
application has not supplied one. An application can own global PrimeReact 10 options such as ripple,
locale, CSP nonce, style container, pass-through defaults, or z-index configuration:

```tsx
import { PrimeReactProvider } from 'primereact/api';
import { CratisComponentsProvider } from '@cratis/components';
import { primeReact10UiLibrary } from '@cratis/components.primereact10';

export const Application = () => (
    <PrimeReactProvider value={{ ripple: true }}>
        <CratisComponentsProvider
            value={{ locale: 'en-US' }}
            library={primeReact10UiLibrary}
        >
            <main>Application content</main>
        </CratisComponentsProvider>
    </PrimeReactProvider>
);
```

The application owns theme imports and any outer provider configuration. Components does not
configure an application's direct PrimeReact usage.

## SSR and package boundaries

All nine slots are required to produce deterministic static markup, and the representative Button
fixture must hydrate without a mismatch. PrimeReact 10 predates modern package export maps, so the
adapter's packed runtime gate verifies the exact legacy module interop used by the published build.
Hosts remain responsible for loading global theme CSS in the framework-prescribed location and for
CSP or style-container configuration.

PrimeReact is a bounded peer and is never bundled. The exact repository proof uses PrimeReact
10.9.9 and React 19. PrimeReact 10 and 11 cannot satisfy one another's peer range and must not share
one Storybook preview or application dependency resolution.

The adapter requires `@cratis/components >=4 <5`. This range is intentionally bounded to the
Components major whose renderer ABI and stable presentation profile it implements.

See [CONFORMANCE.md](./CONFORMANCE.md) for bounded evidence and
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for upstream licensing.

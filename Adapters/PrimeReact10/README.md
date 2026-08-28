<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# `@cratis/components.primereact`

PrimeReact 11 adapter for the nine stable presentation slots in the Cratis Components renderer ABI
v1. The package is independently versioned and exports one manifest, `primeReactUiLibrary`.
PrimeReact 10 is out of scope here and remains a required, separate
`@cratis/components.primereact10` implementation before V4 completion.

## Install

```sh
npm install @cratis/components.primereact @cratis/components \
  @primereact/core @primereact/ui primereact @primeuix/themes react react-dom
```

The adapter uses PrimeReact 11 styled components. It covers Button, IconButton, TextInput,
TextArea, Checkbox, Radio, Switch, ProgressBar, and Surface. The five atomic interaction slots are
not part of this profile.

## Application-owned provider and license

PrimeReact 11 requires a license key. The application owns that key and passes it directly to its
outer `PrimeReactProvider`; Components never receives, stores, copies, logs, serializes, or proxies
it. PrimeReact's runtime context deliberately omits the key, so the application also passes one
non-secret boolean attestation to `CratisComponentsProvider`.

```tsx
import { PrimeReactProvider } from '@primereact/core/config';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';
import { primeReactUiLibrary } from '@cratis/components.primereact';

const primeUiLicenseKey = import.meta.env.VITE_PRIMEUI_LICENSE_KEY;

export const Application = () => (
    <PrimeReactProvider license={primeUiLicenseKey} theme={{ preset: Aura }}>
        <CratisComponentsProvider
            value={{ locale: 'en-US' }}
            library={primeReactUiLibrary}
            rendererSetup={{
                'cratis-primereact.license-configured': Boolean(primeUiLicenseKey),
            }}
        >
            <main>Application content</main>
        </CratisComponentsProvider>
    </PrimeReactProvider>
);
```

The adapter throws `CRATIS-UI-1005` synchronously when either the outer provider or the attestation
is absent. Setting the attestation to `true` is an application assertion that the key was actually
supplied; it is not a substitute for doing so. This prevents Components from creating a second
provider and fails before adapter content when setup was not attested. The adapter does not validate
the key and cannot guarantee that PrimeUI will accept it or omit its own license notice.

Obtain a key from [PrimeUI](https://primeui.store/primeui). For Vite, expose the application-owned
key as `VITE_PRIMEUI_LICENSE_KEY` only in the client build that mounts PrimeReact. In CI or a
publishing pipeline, map a protected `PRIMEUI_LICENSE_KEY` secret into that build variable without
echoing it or writing it to package artifacts. The adapter package itself reads no license
environment variable and includes no key.

## Styling and SSR

The application chooses the PrimeReact theme on its outer provider. The package's static metadata
uses `VITE_PRIMEUI_LICENSE_KEY` only as documentation/discovery metadata; no runtime lookup occurs.
All nine slots produce deterministic SSR output, and the representative Button fixture hydrates
without a mismatch. The host remains responsible for PrimeReact's provider, theme, CSP, and style
collection/injection requirements.

## Peer policy

PrimeReact packages are bounded to `>=11 <12`, PrimeUX themes to `>=3 <4`, and React/ReactDOM to
React 19. Vendor packages are peers and are never bundled. Exact repository proof uses 11.1.0 and
`@primeuix/themes` 3.0.0.

The current `@cratis/components` peer `>=3.0.0 <4` is a temporary repository placeholder matching
the unreleased V4 source package. **It must become the honest `>=4 <5` range before publication.**
Publishing with the placeholder would misstate compatibility.

See [CONFORMANCE.md](./CONFORMANCE.md) for bounded evidence and
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for upstream licensing.

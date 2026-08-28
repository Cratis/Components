---
title: Renderer licensing policy
description: Package, provider, and key ownership rules for the built-in renderer and optional vendor adapters.
---

<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

Renderer choice changes the application's dependency and license boundary. Components keeps that
choice explicit in package metadata and never treats a renderer provider as a credential channel.

This page states the Components integration policy. It is not legal advice and does not replace the
license and commercial terms shipped or published by each upstream vendor.

## Package policy

| Surface or package                        | Declared license boundary       | Components policy                                                  |
| ----------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `@cratis/components`                      | MIT package metadata            | Built-in React Aria dependencies retain their own permissive terms |
| `@cratis/components.mui`                  | MIT adapter; peer-hosted MUI    | Application installs and configures MUI and Emotion peers          |
| `@cratis/components.primereact10`         | MIT adapter; PrimeReact 10 peer | Application owns the theme and any direct PrimeReact 10 provider   |
| `@cratis/components.primereact`           | MIT adapter; PrimeUI peers      | Application owns PrimeReact 11 provider, terms, key, and theme     |
| Commercial vendor suites outside adapters | Vendor-specific                 | Interop only; application owns procurement, terms, and integration |

A permissive adapter license does not relicense its peers. Review the exact installed package
manifests, `LICENSE`, `THIRD_PARTY_NOTICES.md`, and upstream terms before adoption.

## Permissive peers

The MUI adapter declares MUI 9 and Emotion 11 as peers. The PrimeReact 10 adapter declares
PrimeReact `>=10.9.9 <11` as a peer. Those packages are not bundled into their adapter archives.
The application selects compatible versions and remains responsible for their providers, themes,
server-rendering setup, security updates, and license obligations.

The built-in renderer remains part of `@cratis/components`. React Aria supplies selected internal
interaction behavior under its own permissive license; installing another adapter does not remove
that fallback dependency from the Components installation.

## PrimeReact 11 key ownership

PrimeReact 11 is represented in package metadata with `LicenseRef-PrimeUI` and `requiresKey: true`.
The application obtains and owns the key, then passes it directly to its outer `PrimeReactProvider`.
Components and `@cratis/components.primereact` never receive, store, copy, log, serialize, proxy, or
validate that key.

The application also passes this non-secret boolean setup assertion:

```tsx
import { PrimeReactProvider } from '@primereact/core/config';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '@cratis/components';
import { primeReactUiLibrary } from '@cratis/components.primereact';

const primeUiLicenseKey = import.meta.env.VITE_PRIMEUI_LICENSE_KEY;

export const Application = () => (
    <PrimeReactProvider license={primeUiLicenseKey} theme={{ preset: Aura }}>
        <CratisComponentsProvider
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

The boolean says only that the application completed its own setup. It is not a key, does not prove
that the key is valid, and does not suppress upstream license behavior. The adapter fails closed
when the outer provider or the attestation is absent.

Never place a key in `rendererSetup`, Components configuration, a renderer manifest, a published
package, a Storybook parameter, a test fixture, or a log. A client application must follow its own
secret-to-client-build policy for any key the vendor requires at runtime.

## Commercial-suite interop

A commercial grid, scheduler, editor, or design suite can coexist as an application-owned surface.
Components does not bundle it, redistribute it, sell access to it, acquire a key for the application,
or claim that a Cratis composite becomes that suite's native component.

Treat this as interop:

- the application installs the vendor package and accepts its terms;
- the application supplies provider configuration and credentials directly to the vendor API;
- the application owns vendor-native workflow composition and testing;
- the adapter, if one exists, implements only its declared Cratis slots; and
- Components conformance evidence does not certify vendor licensing compliance.

If a vendor's terms restrict component-library adapters, redistribution, development tools, or OEM
use, obtain the required rights before publishing or distributing that integration. Components
metadata cannot grant those rights.

## Release evidence

The repository compatibility manifest records package names, current versions, peer ranges,
upstream ranges, renderer ABI major, and private/non-published evidence artifacts. It does not enable
publication. The final package-version and Core peer-range sweep is a separate atomic release step.

Read [renderer coexistence](index.md) for provider/portal ownership and [unsupported renderer claims](unsupported.md)
before approving a renderer architecture.

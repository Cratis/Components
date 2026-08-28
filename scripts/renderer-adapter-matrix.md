<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# Packed renderer adapter boundary matrix

[`renderer-adapter-matrix.json`](./renderer-adapter-matrix.json) is the single checked-in source for
the supported lower and current-highest packed-consumer fixtures. It keeps Material UI,
PrimeReact 11, and PrimeReact 10 separate and records exact versions for every fixture peer.
Adapter package versions are deliberately absent: the verifier reads package names and versions
from the archives it builds.

Run the matrix's validation self-tests before a packed case:

```sh
yarn test-renderer-adapter-matrix
```

Run one package-manager case locally with:

```sh
yarn verify-renderer-adapters --adapter mui --boundary minimum --manager npm
```

Valid adapters are `mui`, `primereact11`, and `primereact10`; boundaries are `minimum` and
`current`; managers are `npm`, `pnpm`, and `yarn-pnp`. Use `all` for any dimension only when the
longer local run is intentional.

Each case validates the entire matrix against the source manifests before building. It then builds
and packs Core and one adapter, validates the packed manifests again, installs only those tarballs
and exact fixture peers in a fresh temporary consumer, imports the adapter's only public manifest,
and checks every resolved renderer upstream version. npm uses strict peer dependency resolution,
pnpm uses `--strict-peer-dependencies`, and Yarn uses Plug'n'Play rather than `node_modules`.

## Narrow Yarn PnP corrections

The matrix records only two confirmed upstream manifest omissions:

- `@cratis/arc.react@22.5.0` imports `rxjs` without declaring it; and
- each exact tested `@primereact/ui` 11 package uses the aligned `@primereact/core` package without
  declaring that direct dependency.

The verifier derives exact `packageExtensions` selectors and dependency versions from the selected
fixture. These extensions add missing dependency edges only. They do not widen or replace any peer
range. Any new exception must first be reproduced under Yarn PnP and documented here and in the
single matrix source.

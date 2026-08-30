<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# @cratis/components.conformance

Development-only verification for authors of `@cratis/components` renderer adapters. Ordinary
applications do not install this package. Adapter authors use it to prove a renderer manifest
against the Components behavior, parts, state, SSR, and accessibility contract.

The package shares the Components repository release version while renderer ABI major `1` remains a
separate protocol version. It is neither an application runtime dependency nor an adapter discovery
mechanism.

> **Publication status:** The install example targets the owner-authorized 4.0.0 npm release. When
> reading this README from repository source before that release, verify availability with
> `npm view @cratis/components.conformance@4.0.0 version`; source contributors use the workspace
> commands below.

## Requirements

- Node.js 23 or newer.
- `@cratis/components >=4 <5`.
- React and ReactDOM 19.
- A DOM test environment. The runner defaults to `globalThis.document`; plain Node without a
  supplied `Document` deliberately fails the `runtime.domAvailable` check.

Install it only in an adapter project:

```sh
npm install --save-dev \
  @cratis/components.conformance@^4 \
  @cratis/components@^4 \
  react@^19 react-dom@^19
```

## Run it in a DOM test

This Vitest example uses jsdom explicitly and passes its `document` to make the environment
requirement visible:

```tsx
// @vitest-environment jsdom

import { expect, it } from 'vitest';
import {
    ConformanceStatus,
    runConformance,
    type ConformanceReport,
} from '@cratis/components.conformance';
import { myLibrary } from '@example/components-adapter';
import packageJson from '@example/components-adapter/package.json' with { type: 'json' };

it('conforms to its declared renderer profile', async () => {
    const report: ConformanceReport = await runConformance(myLibrary, {
        metadata: packageJson.cratis,
        document,
        axe: true,
    });

    const failures = report.checks.filter(
        (check) => check.status === ConformanceStatus.Failed,
    );

    expect(
        failures,
        failures.map((check) => `${check.id}: ${check.message}`).join('\n'),
    ).toEqual([]);
    expect(report.passed).toBe(true);
});
```

An adapter that requires an application-owned outer provider passes it through `wrapper`. The
wrapper receives `children`; it is the correct place for a vendor theme, cache, or licensed provider.
Credentials and license keys must remain application-owned and must not enter adapter metadata.

## Options

| Option     | Purpose                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `metadata` | The adapter package's static `package.json#cratis` metadata. Runtime and static declarations must agree.                  |
| `document` | DOM document for runtime checks. Defaults to `globalThis.document`.                                                       |
| `axe`      | Enables axe-core evidence. Defaults to `true`.                                                                            |
| `wrapper`  | Optional application-owned provider mounted around runtime fixtures.                                                      |
| `skips`    | Explicit `ConformanceSkipRequest[]`. A skip is accepted only when declared fidelity or a missing capability justifies it. |

Do not use skips to make a failing implementation green. Every skip names a check and, when
applicable, a slot or missing capability. The returned report records accepted omissions as
limitations.

## Report and public types

`runConformance()` returns a `ConformanceReport` containing:

- `passed` plus a `ConformanceSummary` of passed, failed, and skipped checks;
- individual `ConformanceCheck` records with family, status, slot, message, evidence, and skip basis;
- explicit `ConformanceLimitation` records describing what the report does not establish.

The package also exports:

- `AdapterPackageMetadata` for the public adapter schema shape;
- `ConformanceLibrary`, the renderer-library structure accepted by the runner;
- `ConformanceFamily` and `ConformanceStatus` enums;
- `ConformanceOptions`, `ConformanceSkipRequest`, `ConformanceCheck`, `ConformanceSummary`,
  `ConformanceLimitation`, and `ConformanceReport` types.

The stable `stable-presentation/v1` profile covers exactly nine primitive slots. The broader
fourteen-slot inventory remains experimental. Checks cover static/runtime metadata consistency,
stable parts and canonical states, pass-through routing, native elements and refs, bounded form and
callback behavior, behavior ownership, SSR/hydration, axe, RTL/forced-color/reduced-motion inputs,
and skip discipline. See [CONFORMANCE.md](./CONFORMANCE.md) for the precise evidence boundary.

## Repository commands

```sh
yarn workspace @cratis/components.conformance build
yarn workspace @cratis/components.conformance test
yarn workspace @cratis/components.conformance verify-package
```

`verify-package` packs the real archive, rejects tests/cache files and forbidden declaration types,
and compiles an external consumer under both Bundler and NodeNext with `skipLibCheck: false`.

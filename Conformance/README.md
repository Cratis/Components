<!-- Copyright (c) Cratis. All rights reserved. -->
<!-- Licensed under the MIT license. See LICENSE file in the project root for full license information. -->

# @cratis/components.conformance

Development-only evidence runner for authors of `@cratis/components` renderer adapters. The package
is independently versioned (`0.1.0`) and records renderer ABI major `1`; it is not a runtime
dependency of Components or an adapter discovery mechanism.

```ts
import { runConformance } from '@cratis/components.conformance';
import { myLibrary } from '@example/components-adapter';
import packageJson from '@example/components-adapter/package.json' with { type: 'json' };

const report = await runConformance(myLibrary, {
    metadata: packageJson.cratis,
});

if (!report.passed) {
    throw new Error(
        report.checks
            .filter(check => check.status === 'failed')
            .map(check => `${check.id}: ${check.message}`)
            .join('\n'),
    );
}
```

The runner uses only public `@cratis/components/renderer` contracts, React, and public component
props/manifests. It covers the fourteen ABI v1 slots with static/runtime metadata consistency,
stable parts and canonical states, pt routing, exact native elements/refs, bounded form and callback
behavior, behavior ownership, SSR/hydration, axe, RTL/forced-color/reduced-motion inputs, and report
skip discipline. See [CONFORMANCE.md](./CONFORMANCE.md) for the precise evidence boundary.

## Commands

```sh
yarn workspace @cratis/components.conformance build
yarn workspace @cratis/components.conformance test
yarn workspace @cratis/components.conformance verify-package
```

`verify-package` packs the real archive, rejects tests/cache files and forbidden declaration types,
and compiles an external consumer under both Bundler and NodeNext with `skipLibCheck: false`.

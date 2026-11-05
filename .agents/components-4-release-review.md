# Components 4 release review

Internal work records moved from `Documentation/ui-foundation.md`. These records are not consumer setup guidance or a roadmap.

## Strict public-type validation

Components 4 validates every public JavaScript subpath as a strict external TypeScript 6.0.3 and 7.0.2 consumer of the actual packed artifact. After building the public workspaces, run `yarn verify-typescript-consumers` for both compilers across Core, Conformance, and the renderer adapters. The verifier creates isolated Bundler and NodeNext fixtures with `skipLibCheck: false`, confirms that declarations come from the fresh archive rather than source or stale output, and reports the compiler version used. The separate spatial peer-topology fixture uses `skipLibCheck: true`; it does not replace this strict declaration matrix.

For a focused Core check, run `yarn workspace @cratis/components verify-public-types` (TypeScript 7 by default), or prefix the command with `CRATIS_TYPESCRIPT_VERSION=6` to select TypeScript 6. Invalid compiler selections fail rather than silently falling back. Both versions run in repository CI.

The repository compiles and emits declarations with TypeScript 7.0.2, installed under the `@typescript/native` alias. It retains TypeScript 6.0.3 under `typescript` for the compiler API used by Rollup, ESLint, Storybook, and the migrator; TypeScript 7 does not provide that API. CLI scripts select the compiler explicitly, avoiding ambiguous `tsc` binaries. This tooling split is not an extra runtime dependency for a Components consumer.

The verifier records any permitted upstream failures in `Source/scripts/verify-public-types.exceptions.json`, with exact versions, diagnostic codes, affected subpaths, resolution modes, and removal conditions. Unlisted diagnostics or stale exceptions fail the gate. A Components declaration diagnostic requires its reviewed TS2834/TS2835 upstream root cause in the same run; similar error text alone cannot suppress it.

The exception list is empty, and the repository pins `@cratis/arc.react` 22.156.2 for development and verification. The Arc package excludes its test-only global JSX declarations; [Cratis/Arc#3588](https://github.com/Cratis/Arc/issues/3588) records the related issue. The peer range still admits earlier Arc releases.

When an exception is listed, a `PASS_WITH_EXCEPTION` result is not an error-free strict consumer: those upstream diagnostics remain reproducible with the pinned releases. The gate reports them rather than disabling declaration checks, and fails on any additional or Components-owned regression.

## Downstream evidence

Exact-artifact downstream runtime and visual evidence remains part of the major release review.

## Post-V4 issue index

These issue records explain decisions and evidence gaps outside the Components 4 contract. They are not a roadmap or a promise to expand the renderer API:

| Issue | Tracked decision or evidence gap |
| --- | --- |
| [#207](https://github.com/Cratis/Components/issues/207) | Components 4 registry bootstrap, release execution, and post-publication verification. |
| [#208](https://github.com/Cratis/Components/issues/208) | Proof and possible promotion of atomic slots and mixed-renderer islands. |
| [#209](https://github.com/Cratis/Components/issues/209) | Schema-driven public renderer discovery tooling. |
| [#210](https://github.com/Cratis/Components/issues/210) | Lazy renderer preload semantics for streaming server rendering. |
| [#211](https://github.com/Cratis/Components/issues/211) | Cross-browser and assistive-technology renderer certification. |
| [#212](https://github.com/Cratis/Components/issues/212) | CSS theme bridges and vendor portal-interoperability recipes. |
| [#213](https://github.com/Cratis/Components/issues/213) | Source-map preservation through ESM specifier rewriting. |
| [#214](https://github.com/Cratis/Components/issues/214) | Evidence for or against a renderer-exclusive slim distribution. |
| [#215](https://github.com/Cratis/Components/issues/215) | Reviewed dependency-update pull requests. |
| [#216](https://github.com/Cratis/Components/issues/216) | Packed public-API snapshots and semantic-version surface diffs. |
| [#217](https://github.com/Cratis/Components/issues/217) | Generated evidence inventories instead of hardcoded check counts. |
| [#218](https://github.com/Cratis/Components/issues/218) | Renderer bundle and runtime-performance regression budgets. |

Read the issue itself for its status and discussion. The public renderer boundary remains the exact nine-slot `stable-presentation/v1` profile, boolean setup assertions, and `CratisOverlayEnvironment`; an issue does not expand that contract.

## Release gates

Components 4 releases use these repository release checks:

- Emitted JavaScript and declarations contain no Prime imports or type references.
- Real npm, strict pnpm, and Yarn PnP packed consumers pass with Pixi both absent and present; present topologies prove Components and the consumer resolve one Pixi instance.
- The setup root and every non-spatial subpath load without Pixi, while Canvas and PivotViewer fail specifically on the missing optional peer until it is installed.
- Declared Arc peer versions are exercised against the packed artifact.
- Representative custom-theme and pass-through consumers compile after following the guide.
- Specs, package exports, SSR, keyboard/focus behavior, responsive layouts, dark mode, forced colors, and reduced motion pass.
- Storybook builds and runs under baseline light and dark modes for the built-in renderer and every metadata-discovered public adapter; private ui-adapter workspaces are excluded, and the Plain DOM renderer is a conformance fixture, not an adapter workspace.
- The migration guide works without repository-specific knowledge.
- Every packed public JavaScript subpath passes strict TypeScript 6 and 7 validation or matches a bounded machine-readable upstream exception with exact installed versions and an unmet removal condition. Components-owned cascades additionally require their matching upstream TS2834/TS2835 root cause in the same compiler run.

These checks cover package and component behavior, not every consuming application's theme, overlays, or accessibility needs.

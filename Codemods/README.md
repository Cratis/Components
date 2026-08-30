# @cratis/components-codemods

Migration codemods in the Components 4 candidate move Components 3 root namespaces to Components 4 explicit subpath imports, replace deprecated Button appearance props, and update legacy event-wrapper callbacks to semantic value callbacks. Each transform is independently invokable and idempotent. Components 4 keeps only package-wide provider setup at the root; every component is imported from its explicit subpath (`@cratis/components/Canvas`, for example). The companion `@cratis/eslint-plugin-components` package's `no-root-barrel-import` rule enforces this once a consumer has migrated.

## `remove-root-namespace-imports`

An idempotent, AST-based codemod built on the TypeScript compiler API. The published CLI
brings its own `typescript` runtime dependency, so its parser does not depend on the consumer
application's TypeScript version. It rewrites static `import` declarations and named
`export … from` re-exports only; it never guesses, and reports every case it will not touch.

### What it rewrites

| Before                                              | After                                                       |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `import { Canvas } from '@cratis/components';`      | `import * as Canvas from '@cratis/components/Canvas';`      |
| `import type { Canvas } from '@cratis/components';` | `import type * as Canvas from '@cratis/components/Canvas';` |
| `import { Canvas as C } from '@cratis/components';` | `import * as C from '@cratis/components/Canvas';`           |
| `export { Canvas } from '@cratis/components';`      | `export * as Canvas from '@cratis/components/Canvas';`      |
| `export type { Canvas } from '@cratis/components';` | `export type * as Canvas from '@cratis/components/Canvas';` |
| `export { Canvas as C } from '@cratis/components';` | `export * as C from '@cratis/components/Canvas';`           |

A named `export … from '@cratis/components'` re-export follows exactly the same rules as an
import, because the transformation is equally unambiguous in both directions: the exported
name identifies one specific namespace (or approved setup symbol), so the codemod can
rewrite it without guessing. Only a **wildcard** re-export of the whole package —
`export * from '@cratis/components'` or `export * as X from '@cratis/components'` — stays
unsupported, for the same reason a whole-package namespace import stays unsupported: see
[What it refuses to guess](#what-it-refuses-to-guess).

The historical `CommandStepper` root namespace is a special case: it aliased the complete `CommandDialog` module. The codemod therefore maps it to `@cratis/components/CommandDialog`, preserving the module identity for members retained in Components 4. It cannot restore a removed module export such as the accidental `CommandStepperContent` surface. New code that only needs the standalone component should use `import { CommandStepper } from '@cratis/components/CommandStepper'` (or the equivalent re-export).

Multiple namespaces in one import or re-export become one subpath statement per namespace:

```ts
// Before
import { Canvas, Common } from '@cratis/components';

// After
import * as Canvas from '@cratis/components/Canvas';
import * as Common from '@cratis/components/Common';
```

A mixed import or re-export naming both an approved setup symbol and a namespace is split —
the setup symbol stays at the root, the namespace moves to its subpath:

```ts
// Before
import { CratisComponentsProvider, Canvas } from '@cratis/components';

// After
import { CratisComponentsProvider } from '@cratis/components';
import * as Canvas from '@cratis/components/Canvas';
```

Running the codemod again on its own output is a no-op — it only ever matches an import or
named re-export whose module specifier is exactly `@cratis/components` (or the `--package`
override), so an already-migrated subpath import or re-export is never revisited.

The complete namespace → subpath map, known removed Components 3 compatibility exports, and approved-root-symbol allowlist live in [`lib/namespaceMap.js`](./lib/namespaceMap.js), mirrored by `ESLint/lib/rootNamespaceMap.js`. Contributors must update both packages together when a namespace subpath, removed boundary, or setup symbol changes. The packages still ship independently; parity specs prevent their migration contracts from drifting.

### What it refuses to guess

Each of these is left completely untouched, and reported as a diagnostic instead:

- A namespace import of the whole package — `import * as Components from '@cratis/components';`.
  Which subpath each later `Components.X` access belongs to cannot be inferred from the
  import alone.
- A default import — `import Components from '@cratis/components';`. The package has no
  default export.
- A side-effect-only import — `import '@cratis/components';`. There is no binding to infer a
  subpath from.
- A named import of a symbol that is neither an approved setup symbol nor a known namespace
  (for example a member like `Button` that only exists _inside_ a namespace, not at the
  root). The whole import statement is left untouched rather than partially migrated.
- The Components 3.6 `Compatibility` namespace and its direct pass-through exports. They
  are recognized known removals, not unknown symbols: Components 4 has no compatibility
  subpath, so the transform leaves the statement untouched and directs the consumer to
  typed Cratis parts.
- A TypeScript import assignment — `import Components = require('@cratis/components');`.
  This is the whole package namespace, so later member access is as ambiguous as `import * as`.
- A dynamic `import('@cratis/components')` or a CommonJS `require('@cratis/components')`,
  anywhere in the file.
- A wildcard re-export of the whole package — `export * from '@cratis/components';` — or a
  namespace re-export of the whole package — `export * as Components from
'@cratis/components';`. Both are exactly as ambiguous as a whole-package namespace import:
  which subpath each later access needs cannot be determined from the re-export alone. A
  _named_ re-export (`export { Canvas } from '@cratis/components';`) is not in this list —
  see [What it rewrites](#what-it-rewrites).

Existing subpath imports and re-exports (`@cratis/components/Canvas`, …) are never touched —
narrow subpath consumers are left exactly as they are.

### Use

The packaged CLI requires Node.js 20 or newer and brings its own TypeScript parser; it does
not depend on the consumer application's TypeScript version. It scans JavaScript, JSX,
TypeScript, and TSX sources, including `.mjs`, `.cjs`, `.mts`, and `.cts` variants. Components
3 has no 3.x codemod package. Use the independently released Components 4 tooling train bounded
to `>=4 <5`; never use `latest`.

Before any scan or write, the CLI validates its bundled compatibility manifest, checks its own
version against the declared codemod range, resolves the configured Components package from the
invocation directory, and verifies that package is in the supported 3.x migration-source or 4.x
migration-target window. Missing Components, unsupported versions, stale package metadata, and an
invalid manifest fail closed. `--help` remains available without Components installed.

```sh
TOOLING_RANGE='^4.0.0' # Shell-safe equivalent of >=4 <5.

# Preview what would change, without writing anything:
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src

# Apply the rewrite:
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports path/to/app/src

# Contributors to this repository can run the workspace source directly:
node Codemods/scripts/remove-root-namespace-imports.js --check Source
```

The same bounded package works in pnpm and Yarn 2+ projects:

```sh
pnpm dlx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
yarn dlx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
```

Quote any path containing spaces. Angle-bracket placeholders are intentionally not used in executable examples because `<...>` is shell input-redirection syntax.

Exit code is non-zero whenever an unsupported case was found (with `--check` or without —
those always need a human), and, in `--check` mode only, whenever a supported rewrite has
not yet been applied. Run `--help` for the full option list.

After running the codemod, run the project's own build/lint/test gates — the codemod only
performs the mechanical import/re-export rewrite; it does not attempt to fix any resulting
unused import, nor does it know whether a namespace member you use (`Canvas.Foo`) still
exists at that subpath.

## `button-variant-tone`

`cratis-components-button-variant-tone` resolves `Button` JSX bindings imported, including aliases and `Common.Button` namespace access, from `@cratis/components/Common`. It applies the runtime's legacy precedence (`link` → `text` → `outlined` → `solid`) and replaces deprecated props:

| Deprecated prop                       | Semantic prop       |
| ------------------------------------- | ------------------- |
| `text`                                | `variant='ghost'`   |
| `link`                                | `variant='link'`    |
| `outlined`                            | `variant='outline'` |
| `rounded`                             | `shape='pill'`      |
| `severity='secondary'` / `'contrast'` | `tone='neutral'`    |
| `severity='info'` / `'help'`          | `tone='accent'`     |
| `severity='success'`                  | `tone='positive'`   |
| `severity='warn'`                     | `tone='caution'`    |
| `severity='danger'`                   | `tone='critical'`   |

A literal `severity='contrast'` also receives `variant='solid'` only when no explicit new variant or stronger true legacy variant applies. A literal new `variant`, `tone`, or `shape` wins and its redundant legacy prop is removed.

```tsx
// Safe rewrite
<Button outlined rounded severity='warn' />
// becomes
<Button variant='outline' shape='pill' tone='caution' />
```

The transform never guesses through JSX spreads, dynamic legacy values, duplicate props, or an unknown new-prop expression that conflicts with a legacy prop. It leaves the uncertain prop group semantically unchanged, reports it, and adds one syntax-safe `TODO(cratis-codemod)` annotation. Subsequent runs do not duplicate that annotation.

```tsx
// Refused and reported
<Button text={appearance.text} severity={appearance.severity} />
```

## `change-handler`

`cratis-components-change-handler` resolves affected Components-owned JSX identifiers imported with aliases or namespaces from `@cratis/components/Dropdown`, `@cratis/components/CommandForm`, and `@cratis/components/CommandForm/fields`. It rewrites only a structurally-proven single forwarding callback:

```tsx
// Safe rewrites
<Dropdown onChange={(event) => setRole(event.value)} />
<InputTextField onChange={(event) => setName(event.target.value)} />
<CheckboxField onChange={({ target: { checked } }) => setEnabled(checked)} />

// become
<Dropdown onChange={(value) => setRole(value)} />
<InputTextField onChange={(value) => setName(value)} />
<CheckboxField onChange={(value) => setEnabled(value)} />
```

The affected CommandForm fields cover legacy `target`/`currentTarget` `value`, `checked`, and `valueAsNumber` payloads, plus `DropdownField`/`MultiSelectField` `event.value`. Already-semantic callbacks and callback references such as `onChange={setValue}` are unchanged.

Multi-statement, multi-use, wrong-payload, destructuring-with-default/rest, and native-event-dependent callbacks are refused, reported, and annotated once:

```tsx
// Refused and reported: the host still depends on the old event object
<Dropdown
    onChange={(event) => {
        audit(event.originalEvent);
        setRole(event.value);
    }}
/>
```

## Run the migration sequence

Use the bounded Components 4 tooling train for all three commands. The recommended source/target order is:

1. With Components 3 (`>=3 <4`) installed, preview and apply the root-import transform. Its subpaths exist in both majors.
2. Run the Components 3 gates and checkpoint the import-only change.
3. Upgrade Core to Components 4 (`^4.0.0`).
4. Preview and apply Button appearance, then change-handler migration; these produce Components 4 source.

Preflight also accepts the Components 4 target window so the root transform can be recovered after an upgrade. It accepts no other Core major. Preview every step before applying it:

```sh
TOOLING_RANGE='^4.0.0'

npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-remove-root-namespace-imports path/to/app/src

npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-button-variant-tone --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-button-variant-tone path/to/app/src

npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-change-handler --check path/to/app/src
npx --package "@cratis/components-codemods@$TOOLING_RANGE" \
  cratis-components-change-handler path/to/app/src
```

Never substitute `latest`; keep tooling within `>=4 <5`. Tooling packages share the repository release version with Core, and the bounded range plus bundled manifest preflight enforce the compatible migration windows without exact-patch coupling. Both new CLIs require Node.js 20 or newer, bundle their own TypeScript compiler dependency, scan `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.mts`, and `.cts` recursively, support `--package <name>`, and exit nonzero for pending check-mode edits or any refused case. Review every diagnostic and `TODO(cratis-codemod)`, then run the consuming project's formatter, lint, type check, tests, and production build.

Contributor source commands are:

```sh
node Codemods/scripts/button-variant-tone.js --check Source
node Codemods/scripts/change-handler.js --check Source
```

### Test

```sh
cd Codemods && yarn test
```

Repository fixtures for every supported and unsupported case live under
`Codemods/test/fixtures`,
each as an `input.ts`/`expected.ts` pair (`input.ts` and `expected.ts` are identical for an
unsupported case, since nothing should change).

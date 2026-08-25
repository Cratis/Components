# @cratis/components-codemods

Internal, unpublished codemods that support the Components 3 root-namespace-removal migration. Components 4 keeps only package-wide provider setup at the root; every component is imported from its explicit subpath (`@cratis/components/Canvas`, for example). See
[`ESLint`'s `no-root-barrel-import` rule](../ESLint/README.md) for the lint-time guard that
enforces this once a consumer has migrated.

## `remove-root-namespace-imports`

An idempotent, AST-based codemod built on the TypeScript compiler API (`typescript`, already
a repository devDependency — no new dependency was added for this tool). It rewrites static
`import` declarations only; it never guesses, and reports every case it will not touch.

### What it rewrites

| Before                                              | After                                                       |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `import { Canvas } from '@cratis/components';`      | `import * as Canvas from '@cratis/components/Canvas';`      |
| `import type { Canvas } from '@cratis/components';` | `import type * as Canvas from '@cratis/components/Canvas';` |
| `import { Canvas as C } from '@cratis/components';` | `import * as C from '@cratis/components/Canvas';`           |

Multiple namespaces in one import become one subpath import per namespace:

```ts
// Before
import { Canvas, Common } from '@cratis/components';

// After
import * as Canvas from '@cratis/components/Canvas';
import * as Common from '@cratis/components/Common';
```

A mixed import naming both an approved setup symbol and a namespace is split — the setup
symbol stays at the root, the namespace moves to its subpath:

```ts
// Before
import { CratisComponentsProvider, Canvas } from '@cratis/components';

// After
import { CratisComponentsProvider } from '@cratis/components';
import * as Canvas from '@cratis/components/Canvas';
```

Running the codemod again on its own output is a no-op — it only ever matches an import
whose module specifier is exactly `@cratis/components` (or the `--package` override), so an
already-migrated subpath import is never revisited.

The complete namespace → subpath map and the approved-root-symbol allowlist live in
[`lib/namespaceMap.js`](./lib/namespaceMap.js), mirrored from `Source/index.ts`. Update both
that file and [`ESLint/lib/rootNamespaceMap.js`](../ESLint/lib/rootNamespaceMap.js) together
when a namespace subpath is added, renamed, or removed.

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
- A dynamic `import('@cratis/components')` or a CommonJS `require('@cratis/components')`,
  anywhere in the file.
- Any `export … from '@cratis/components'` re-export form. This codemod only rewrites
  `import` declarations; re-exports are reported with subpath guidance but not rewritten.

Existing subpath imports (`@cratis/components/Canvas`, …) are never touched — narrow subpath
consumers are left exactly as they are.

### Use

```sh
# Preview what would change, without writing anything:
node Codemods/scripts/remove-root-namespace-imports.js --check path/to/app/src

# Apply the rewrite:
node Codemods/scripts/remove-root-namespace-imports.js path/to/app/src

# One specific file:
node Codemods/scripts/remove-root-namespace-imports.js --check path/to/App.tsx
```

Exit code is non-zero whenever an unsupported case was found (with `--check` or without —
those always need a human), and, in `--check` mode only, whenever a supported rewrite has
not yet been applied. Run `--help` for the full option list.

After running the codemod, run the project's own build/lint/test gates — the codemod only
performs the mechanical import rewrite; it does not attempt to fix any resulting unused
import, nor does it know whether a namespace member you use (`Canvas.Foo`) still exists at
that subpath.

### Test

```sh
cd Codemods && yarn test
```

Fixtures for every supported and unsupported case live under
[`test/fixtures`](./test/fixtures), each as an `input.ts`/`expected.ts` pair (`input.ts` and
`expected.ts` are identical for an unsupported case, since nothing should change).

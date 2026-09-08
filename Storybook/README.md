# Renderer Storybook workspace

This private workspace builds the public Components story corpus once per discovered renderer and composes the resulting previews under one Storybook manager. It is tooling only: `private: true` keeps it out of the repository publication loop, and no generated Storybook output is committed.

## Discovery

`scripts/lib/adapter-inventory.mjs` expands the root Yarn workspaces, selects packages whose `package.json#cratis.kind` is `ui-adapter`, and validates that metadata against `Source/schemas/ui-adapter.schema.json`. Public adapters enter the inventory automatically. A private adapter is recorded as excluded and is never composed. The built-in package is the zero-config default.

An adapter can provide private preview-only provider/theme setup at `<workspace>/.storybook/preview.tsx`. The child build imports that module by convention; no Core renderer list is edited.

## Isolation

Each inventory entry is built by a separate Storybook process into `Source/storybook-static/renderers/<adapter-id>`. The manager references those outputs through Storybook Composition. This process boundary is mandatory for PrimeReact 10 and 11 because they are incompatible majors of the same package. Each child attestation records the exact upstream version selected by the checked-in adapter matrix.

Every child records an ignored `cratis-renderer-attestation.json` beside its generated index. The build fails unless it resolves the adapter workspace's exact PrimeReact development version and no other PrimeReact version. Non-Prime previews fail if they reach PrimeReact at all.

The PrimeReact 11 setup is intentionally bounded to the same public-context fixture used by adapter conformance specs. It passes only `cratis-primereact.license-configured: true`; it does not mount the real provider/license manager and exposes no path for a key. No key may be received, read, stored, logged, serialized, bundled, or proxied by Components or this workspace.

## Commands

Run from the repository root:

```bash
yarn workspace @cratis/components.storybook ci:preflight
yarn workspace @cratis/components.storybook build
yarn workspace @cratis/components.storybook verify-indexes
yarn playwright install chromium
yarn workspace @cratis/components.storybook test-storybook
yarn workspace @cratis/components.storybook dev
```

`test-storybook` runs every discovered stable story in each isolated preview and both maintained appearance modes. The current V4 inventory is four previews × 277 stories × two appearances: **2,216 story/appearance/axe cases**. There is no story sampling or tag exclusion; generated preview indexes identify every executed story, while issue #217 tracks replacing release-snapshot count constants with generated reviewable inventories. The composed renderer control preserves a stable story id when available, but switching previews remounts the iframe and loses component-local state.

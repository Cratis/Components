# Release policy

This repository is fail closed for publication. The checked-in compatibility manifest describes a
`source-candidate`; it is not publication authorization. `.github/workflows/publish.yml` remains a
manual, permissions-empty, failing no-op until owners approve and review a separate release change.
This policy defines that future release gate but does not implement a live publisher.

## General-availability scope

A Components 4 general-availability release covers exactly seven public packages:

1. `@cratis/components`
2. `@cratis/eslint-plugin-components`
3. `@cratis/components-codemods`
4. `@cratis/components.conformance`
5. `@cratis/components.mui`
6. `@cratis/components.primereact`
7. `@cratis/components.primereact10`

The Plain DOM conformance fixture and composed Storybook are private evidence. They are never
published. Package versions belong to independent release trains as declared by each package
manifest and the generated compatibility contract; a source manifest version is not registry
release identity.

## Authorization gate

Publication requires an owner-reviewed change that deliberately switches the generated contract
from `source-candidate` to publication-authorized metadata and sets `publicationEnabled: true`.
That validation must also contain a valid, owner-approved Components 3 EOL date. Authorization must
not be inferred from a branch, commit, tag, package version, passing workflow, or existing registry
package.

Components `>=3 <4` receives maintenance and security-critical support while Components `>=4 <5`
is the current candidate and migration target. Owners must decide and approve the Components 3 EOL
date no later than 12 months after Components 4 GA. The decision is recorded in the compatibility
manifest before publication is enabled.

## Build immutable candidates

The `release-evidence` job in `.github/workflows/javascript-build.yml` is a read-only,
source-candidate evidence job. It builds each publishable workspace shape once, packs the exact
seven `gaScope.publicPackages` archives once, records SHA-256 and SHA-512 checksums, binds a
reproducible CycloneDX 1.6 SBOM to each archive and commit, and retains the resulting hosted
artifact for 30 days. It cannot publish and is not npm trusted-publisher provenance. Contributors
can reproduce the same evidence in an empty caller-owned directory:

```bash
yarn test-release-evidence
yarn generate-release-evidence --output /absolute/path/to/empty/evidence-directory
```

The output directory is never a repository artifact and must not be committed. The evidence index
retains `publicationEnabled: false`; generation refuses publication-enabled metadata.

A future owner-authorized publication job must separately provide trusted-publisher provenance and
consume reviewed immutable archives without rebuilding them. That job does not exist in this
source-candidate tranche.

1. Check out the exact reviewed commit and install with the immutable lockfile.
2. Run all release gates for the seven-package scope and private Plain/Storybook evidence.
3. Pack each public package exactly once. Never rebuild between candidate verification and
   publication.
4. Retain every immutable tarball and record its SHA-256 and SHA-512 digests.
5. Generate and retain an archive-bound SBOM for every tarball.
6. In the future authorized publish job, retain trusted-publisher provenance that binds commit,
   workflow, package, version, tarball digest, and SBOM.
7. Stage candidates under a reviewed non-default npm dist-tag. A candidate must never replace the
   default installation tag implicitly.

No token, license key, registry credential, or signing secret belongs in Components source,
Storybook, package archives, logs, compatibility metadata, or repository variables available to
untrusted code. Publication must use reviewed trusted-publisher identity and a human-protected
environment. There is no automatic deployment approval.

## Publish and promote

Publication is stop-on-first-failure. Do not continue with later packages after any upload,
attestation, digest, SBOM, provenance, or registry check fails. A retry may upload only the exact
same retained immutable tarball whose SHA-512 digest was already reviewed; never rebuild or mutate a
version after a partial failure.

Publish and verify tooling, conformance, and adapters before Core. Promotion order is:

1. `@cratis/eslint-plugin-components`
2. `@cratis/components-codemods`
3. `@cratis/components.conformance`
4. `@cratis/components.mui`
5. `@cratis/components.primereact`
6. `@cratis/components.primereact10`
7. `@cratis/components`

After each candidate upload, verify registry metadata, package visibility, version, dist-tag,
tarball SHA-512, unpacked file inventory, bundled compatibility manifest, SBOM, and provenance.
Only after all seven immutable candidates pass registry verification may owners promote their
reviewed tags. Promotion must preserve independent package versions and the compatibility ranges;
it must not rewrite or repack artifacts.

Create repository tags and a GitHub release only after final registry verification succeeds for all
seven packages. Release notes identify every package version and immutable digest. Do not create a
tag or GitHub release to recover from an incomplete registry publication.

## Safety invariants

- Never restore the obsolete root `publish-version` command or workspace manifest-mutation helper.
- Never publish automatically on push, merge, schedule, release, or another workflow's completion.
- Never auto-approve the protected publication environment.
- Never continue after a package publication failure.
- Never retry using a rebuilt tarball.
- Never put npm or third-party renderer credentials in this repository.
- Never create tags or GitHub releases before registry verification.
- Keep `.github/workflows/publish.yml` workflow-dispatch-only, permissions-empty, and failing while
  `publicationEnabled` is false.

Run `yarn verify-compat-manifest` and `yarn verify-release-safety` for every release-policy change.

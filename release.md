# Release policy

Components follows the standard Cratis label-driven release flow. A pull request merged to `main`
with exactly one `patch`, `minor`, or `major` label triggers `.github/workflows/publish.yml`. A
`no-release` label explicitly suppresses publication for maintenance changes.

## Published packages

One release publishes these seven public packages at the same version:

1. `@cratis/components`
2. `@cratis/eslint-plugin-components`
3. `@cratis/components.migrator`
4. `@cratis/components.conformance`
5. `@cratis/components.mui`
6. `@cratis/components.primereact`
7. `@cratis/components.primereact10`

The Plain DOM conformance fixture and composed Storybook are private verification surfaces and are
never published. Renderer ABI/profile versions are protocol identifiers, not independent package
versions.

## Automatic releases

The publish workflow runs on pushes to `main`. `cratis/release-action` resolves the merged pull
request and its semantic-version label, creates the release version and notes, and tells the npm job
whether publication is required. The npm job:

1. checks out the exact merged commit;
2. installs the committed lockfile with `yarn install --immutable`;
3. builds all public workspaces;
4. updates all seven public workspace versions and local workspace dependencies to the release version;
5. regenerates all three compatibility manifest copies from those bumped versions and verifies they
   match before publishing anything;
6. publishes each package publicly with npm provenance;
7. polls the npm registry until every public package answers at the release version, failing the
   job if one is still missing after about ten minutes; and
8. triggers documentation and sample dependency updates.

`yarn publish-version` performs steps 4–6 in this order, including on manual recovery runs. A
manifest generation or verification failure stops publication before the first package. Publishing
stops on the first package failure. Before a 5.0.0 release, update the Components major window in
`scripts/generate-compat-manifest.mjs`: package policies, `toolingCompatibility` ranges, and the
support-window values and checks in `validateCompatibilityManifest`. Also update
`Migrator/lib/compatibility.js`: `validateBundledManifest` currently requires source `>=3 <4` and
target `>=4 <5`. Otherwise manifest validation or bundled migrator preflight rejects the release.
The workflow fails explicitly when a release-bearing merge cannot be associated with a valid
version label.

## Manual recovery

`workflow_dispatch` is the recovery path when an automatic release did not run. Supply the exact
version and the original merged pull request's consumer-facing release notes. Do not use a new
version merely to recover automation.

The npm job uses trusted publishing through GitHub Actions OIDC (`id-token: write`) and npm 11.5.1
or newer. Every existing package must trust this repository and `.github/workflows/publish.yml`.
A brand-new npm package must receive a one-time authenticated bootstrap publication before trusted
publishing can be configured; do not begin a multi-package release until all package records and
trusted publishers are ready.

## Components 3 maintenance releases

Components 3 is in maintenance support and is released from the `support/3.x` branch, never from
`main`. Land a fix there through a pull request, then dispatch `publish.yml` on `support/3.x` with
the exact 3.x version. That workflow:

- refuses to run anywhere but `support/3.x`, or for a version that is not a new 3.x version;
- builds, lints, and tests before publishing;
- publishes `@cratis/components` and `@cratis/eslint-plugin-components` under the `v3-lts`
  dist-tag. `publish-version` refuses to publish without a non-`latest` tag, so npm `latest` stays
  on the current major. Applications depending on `^3.x` still receive the release through their
  range;
- verifies that the packages reached the registry under `v3-lts` and that `latest` did not move;
  and
- pushes a plain `v3.x.y` git tag and creates no GitHub release. The release action on `main`
  computes its next version from the latest GitHub release, so a 3.x release there would derail
  the next 4.x version.

If a publish ever moves `latest` to 3.x, restore it with an npm account that can manage the
package: `npm dist-tag add @cratis/components@<current 4.x version> latest`, and the same for
`@cratis/eslint-plugin-components`.

## Release evidence and verification

`.github/workflows/javascript-build.yml` generates retained archives, SHA-256/SHA-512 manifests,
and archive-bound CycloneDX 1.6 SBOMs for all seven packages. The evidence job is read-only and does
not publish.

After publication, verify all seven registry versions, public visibility, dist-tags, provenance,
package exports, and exact-version installation. Create or verify the Git tag and GitHub release only
for the version that was actually published.

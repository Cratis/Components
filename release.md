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
4. updates every public workspace and local workspace dependency to the release version;
5. publishes each package publicly with npm provenance; and
6. triggers documentation and sample dependency updates.

Publishing stops on the first package failure. The workflow fails explicitly when a release-bearing
merge cannot be associated with a valid version label.

## Manual recovery

`workflow_dispatch` is the recovery path when an automatic release did not run. Supply the exact
version and the original merged pull request's consumer-facing release notes. Do not use a new
version merely to recover automation.

The npm job uses trusted publishing through GitHub Actions OIDC (`id-token: write`) and npm 11.5.1
or newer. Every existing package must trust this repository and `.github/workflows/publish.yml`.
A brand-new npm package must receive a one-time authenticated bootstrap publication before trusted
publishing can be configured; do not begin a multi-package release until all package records and
trusted publishers are ready.

## Release evidence and verification

`.github/workflows/javascript-build.yml` generates retained archives, SHA-256/SHA-512 manifests,
and archive-bound CycloneDX 1.6 SBOMs for all seven packages. The evidence job is read-only and does
not publish.

After publication, verify all seven registry versions, public visibility, dist-tags, provenance,
package exports, and exact-version installation. Create or verify the Git tag and GitHub release only
for the version that was actually published.

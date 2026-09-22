# Release policy

Components follows the standard Cratis label-driven release flow. A pull request merged to `main`
with exactly one `patch`, `minor`, or `major` label triggers `.github/workflows/publish.yml`. A
`no-release` label explicitly suppresses publication for maintenance changes.

## Next release: 5.0.0

The next release requires a **major** label and version **5.0.0**, not a 4.x minor.
The breaking change is dependency support: Core requires matching Arc and Arc React
versions in `>=22.19.1 <23`, replacing the 4.x declared `>=20.3.1 <23` contract.
All seven packages move together to 5.x; adapters and Conformance require Core `>=5 <6`.
Renderer ABI 1 and the existing profiles remain unchanged. Existing forms remain
compatible, with Guid fields and footer composition added; there is no automatic ID
generation or authentication/authorization change. See [4-to-5 migration](Documentation/Migration/4-to-5.md).

Release validation accepts only explicitly reviewed families (historical 4 and current 5),
checks each family's truthful Arc floor and matching Core peers, and rejects publishing
this source as 4.x or 6.x. The publish runner prepares all seven versions and regenerates
the three compatibility-manifest copies **before** the first publication, preserving
bounded peer contracts. Migrator 5 retains the 3-to-4 transforms and accepts Components
3/4/5 preflight windows; historical Migrator 4 retains its original 3/4 windows.
No source metadata or this document is evidence of an actual publication.

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
4. validates the reviewed release family, updates every public workspace and local non-peer workspace dependency to the release version, preserves bounded family peers, and regenerates bundled compatibility metadata;
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

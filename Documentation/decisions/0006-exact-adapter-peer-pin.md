---
id: '0006'
title: Published adapters pin their Components release
description: Each published adapter and Conformance release peers on exactly the @cratis/components release it ships with.
status: accepted
stage: implemented
class: contract
reversibility: costly
decided: 2026-09-25
decider: woksin
applies-to:
    - 'Adapters/**/*'
    - 'Conformance/**/*'
    - 'scripts/prepare-release-version.mjs'
sidebar:
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

**Provenance:** woksin made this decision on [#233](https://github.com/Cratis/Components/issues/233) on 2026-09-25. This record was written on 2026-09-29 to replace the peer range stated in [Stable presentation renderer profile](0004-stable-presentation-renderer-profile.md), which records the rest of the renderer contract and remains in force.

## Context

[Stable presentation renderer profile](0004-stable-presentation-renderer-profile.md) states that every adapter retains a `@cratis/components >=4 <5` peer range. That range is what the adapter source manifests declare. The release pipeline has always published something else: `scripts/prepare-release-version.mjs` stamps every workspace peer with the release version, so each published adapter and Conformance release requires exactly the `@cratis/components` release it ships with. All 4.x releases are lockstep. #233 reported the contradiction and asked for one answer.

## Decision

Each published adapter (`@cratis/components.primereact`, `@cratis/components.primereact10`, `@cratis/components.mui`) and `@cratis/components.conformance` declares a peer on exactly the `@cratis/components` version it is released with. Applications install and upgrade an adapter and `@cratis/components` together, at the same version. The source manifests keep `>=4 <5` as the bound the renderer ABI major allows. This replaces the peer range sentence in the semver policy of [ADR 0004](0004-stable-presentation-renderer-profile.md); the rest of that record is unchanged.

## Options considered

- Publish the `>=4 <5` range. Rejected for now: it lets an application install an adapter and a core release that were never released and tested together, while the renderer ABI is still new.
- Pin the exact release. Chosen: every installable pair has been through the same release's conformance run.
- Pin a caret range such as `^4.21.0`. Rejected: it has the same untested-pair problem as the full range for every later minor release.

## Default if unanswered

The documented range and the published pin would keep contradicting each other. Readers of ADR 0004 would expect `>=4 <5` and get peer-dependency errors on every Components upgrade that leaves the adapter behind.

## Timeline and scope

In force from 4.x onward. Revisit, with a new record, once the renderer ABI has stayed stable across several releases; widening then means stopping `prepare-release-version.mjs` from rewriting the adapter peers. The renderer ABI, the stable profile and the adapter certification rules in ADR 0004 are out of scope.

## Verification

**Done when:** Every published adapter and Conformance release declares a peer on exactly its own `@cratis/components` version, and the adapter and Conformance READMEs say so.

**Verify by:** `npm view @cratis/components.mui@<version> peerDependencies` (and the same for the other adapters and Conformance) shows `"@cratis/components": "<version>"`.

## Consequences

Every installable adapter and core pair was released and tested together. Applications upgrade the adapter and `@cratis/components` in lockstep on every release, including patch releases, and a peer-dependency error tells them when they have not. Widening the range later is a compatible change; narrowing it again would not be.

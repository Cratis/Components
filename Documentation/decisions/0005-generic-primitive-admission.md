---
id: '0005'
title: Generic primitive admission
description: When a proposed generic primitive belongs in the Components public API.
status: accepted
stage: none
class: product
reversibility: costly
decided: 2026-09-29
decider: woksin (delegated)
applies-to:
    - 'Source/**/*'
    - 'Documentation/why-components.md'
sidebar:
    badge: { text: Accepted, variant: tip }
---

**Status:** Accepted

**Decider note:** The orchestrating agent made this decision under authority delegated by woksin.

## Context

[Public component classification](0002-component-classification.md) distinguishes visual primitives, interaction primitives, and composites among existing exports. Classification alone does not say when a new generic primitive belongs in Components. Without an admission rule, a reusable interaction contract and a thin presentational wrapper can look equally eligible, expanding the public API without clear ownership.

## Decision

Components admits a generic primitive when it provides a reusable interaction contract that Components owns, or when an established Components contract needs it. The request must show that the primitive will be reused, without naming consumers. Markup plus design tokens alone are insufficient. Existing exports remain supported under the [DOM-coupled public component contract](0001-dom-coupled-contract.md); this rule does not remove or reclassify them.

## Options considered

- Admit every generic styled element. Rejected: markup and tokens alone do not establish a Components-owned behavior or a need arising from an established contract.
- Reject all new generic primitives. Rejected: this would prevent shared interaction contracts and primitives needed by existing Components contracts.
- Require evidence of reuse and either owned interaction or an established-contract need. Chosen: it gives requests a testable admission boundary without exposing the identity of any consumer.

## Default if unanswered

Without a shared rule, proposals are evaluated case by case and presentational wrappers can enter the public API without demonstrating why Components should maintain them. The cost is a growing compatibility obligation for surfaces with no owned interaction or established-contract need.

## Timeline and scope

Apply this rule to proposals for new generic public primitives from this decision onward. It does not change the support of existing exports, the classification in ADR 0002, or application-owned presentational components. Revisit by a new decision if the admission boundary changes.

## Verification

**Done when:** New generic primitive proposals show anonymous evidence of reuse and identify the Components-owned interaction contract or established Components contract that needs the primitive.

**Verify by:** Review the proposal and its public export against both admission conditions; reject markup-and-tokens-only proposals and check that no consumer is named in public evidence.

## Consequences

Reusable interaction behavior has a clear home in Components, and established Components contracts can gain the primitives they need. A purely presentational one-off stays application-owned. Authors must show reuse and ownership before adding a new public compatibility commitment, while current exports remain supported.

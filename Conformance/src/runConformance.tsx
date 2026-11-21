// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    act,
    createElement,
    createRef,
    type ComponentType,
    type ReactElement,
} from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import axe from 'axe-core';
import { CratisComponentsProvider } from '@cratis/components';
import type {
    unstable_SlotDeclaration,
    unstable_SlotId,
    unstable_UiLibrary,
} from '@cratis/components/renderer';
import {
    cratisCanonicalPartStates,
    cratisParts,
    cratisPartStates,
} from '@cratis/components/types';
import type { ConformanceCheck } from './ConformanceCheck.js';
import { ConformanceFamily } from './ConformanceFamily.js';
import type { ConformanceLibrary } from './ConformanceLibrary.js';
import type { ConformanceOptions } from './ConformanceOptions.js';
import type { ConformanceReport } from './ConformanceReport.js';
import { ConformanceStatus } from './ConformanceStatus.js';
import {
    compareMetadata,
    overDeclaredCapabilities,
    validateMetadata,
} from './internal/metadata.js';
import {
    composeHandlers,
    listen,
    mergeRefs,
    normalizeReactProps,
    normalizeStyle,
} from './internal/reactNormalization.js';
import { exercisedLibrary } from './internal/atomicSlots.js';
import {
    absentPartsOf,
    findNativeRoot,
    rendersDialogRoot,
    stateAssociationsOf,
} from './internal/nativeRoot.js';
import { createSlotProfiles } from './internal/slotProfiles.js';
import type { SlotProfile } from './internal/SlotProfile.js';

interface MountedFixture {
    readonly container: HTMLDivElement;
    readonly form: HTMLFormElement;
    readonly root: Root;
    readonly ref: React.RefObject<Element | null>;
}

const limitations = Object.freeze([
    {
        id: 'automated-a11y-only',
        message:
            'axe evidence is automated DOM analysis, not manual assistive-technology or universal accessibility conformance.',
    },
    {
        id: 'jsdom-not-browser-matrix',
        message:
            'The API exercises DOM, forms, hydration-shaped markup, direction, and media-query inputs; it does not replace the repository Storybook browser/axe gate or a browser matrix. Focus-trap containment, top-layer stacking, and modal inertness are browser-only.',
    },
    {
        id: 'visual-modes-not-screenshots',
        message:
            'Reduced-motion and forced-colors results prove deterministic execution under those inputs, not visual contrast, animation, or high-contrast appearance.',
    },
]);

const renderComponent = (
    declaration: unstable_SlotDeclaration<unstable_SlotId>,
    props: Readonly<Record<string, unknown>>,
    ref?: React.RefObject<Element | null>,
): ReactElement => {
    // SAFETY: Slot profiles pair each declaration with props from the same public slot contract.
    const Component = declaration.render as unknown as ComponentType<
        Record<string, unknown>
    >;
    return createElement(Component, ref ? { ...props, ref } : props);
};

const withProvider = (child: ReactElement, Wrapper: ConformanceOptions['wrapper']) => {
    const components = createElement(CratisComponentsProvider, {
        value: { locale: 'en-US' },
        children: child,
    });
    return Wrapper ? createElement(Wrapper, { children: components }) : components;
};

const mount = async (
    document: Document,
    declaration: unstable_SlotDeclaration<unstable_SlotId>,
    props: Readonly<Record<string, unknown>>,
    refCapable: boolean,
    wrapper: ConformanceOptions['wrapper'],
    host: ParentNode = document.body,
): Promise<MountedFixture> => {
    const container = document.createElement('div');
    const form = document.createElement('form');
    container.append(form);
    host.append(container);
    const root = createRoot(form);
    const ref = createRef<Element>();
    await act(async () => {
        root.render(
            withProvider(
                renderComponent(declaration, props, refCapable ? ref : undefined),
                wrapper,
            ),
        );
    });
    return { container, form, root, ref };
};

const unmount = async (fixture: MountedFixture) => {
    await act(async () => fixture.root.unmount());
    fixture.container.remove();
};

const interactionMessages = {
    keyboard: 'The slot is operable from the keyboard.',
    focus: 'The slot manages focus as its contract requires.',
    dismissal: 'The slot dismisses on Escape.',
} as const;

const recordInteractions = (
    checks: ConformanceCheck[],
    profile: SlotProfile,
    observed: Awaited<ReturnType<NonNullable<SlotProfile['interact']>>>,
) => {
    for (const concern of ['keyboard', 'focus', 'dismissal'] as const) {
        const passed = observed[concern];
        if (passed === undefined) continue;
        addCheck(
            checks,
            ConformanceFamily.Behavior,
            `behavior.${profile.slotId}.${concern}`,
            {
                passed,
                message: passed
                    ? interactionMessages[concern]
                    : `${interactionMessages[concern]} It did not respond as required.`,
                slotId: profile.slotId,
                evidence: { concern, passed, ...observed.detail },
            },
        );
    }
};

/**
 * Drives a fresh fixture of a stable atomic slot with dispatched keyboard and focus events and adds
 * one check per concern the slot reports: `behavior.<slot>.keyboard`, `.focus` and `.dismissal`.
 */
const checkInteractions = async (
    checks: ConformanceCheck[],
    document: Document,
    { declaration, profile }: { declaration: unstable_SlotDeclaration<unstable_SlotId>; profile: SlotProfile },
    options: ConformanceOptions,
) => {
    let fixture: MountedFixture | undefined;
    try {
        fixture = await mount(
            document,
            declaration,
            profile.createProps(),
            profile.refCapable,
            options.wrapper,
        );
        const mounted = fixture;
        const interacted =
            (await act(async () => profile.interact?.(document, mounted.container))) ?? {};
        const observed = { ...interacted, ...(await interacted.settled?.()) };
        recordInteractions(checks, profile, observed);
    } catch (error) {
        addError(checks, ConformanceFamily.Behavior, `behavior.${profile.slotId}.interaction`, { error, slotId: profile.slotId });
    } finally {
        if (fixture) await unmount(fixture);
    }
};

const markerForPart = (part: string) =>
    part.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

const collectElementStates = (element: HTMLElement, observed: Set<string>) => {
    const part = element.getAttribute('data-cratis-part');
    if (!part) return;
    for (const state of cratisCanonicalPartStates) {
        if (element.hasAttribute(`data-${state}`)) observed.add(`${part}.${state}`);
    }
};

const collectRenderedStates = (root: ParentNode, observed: Set<string>) => {
    for (const element of root.querySelectorAll<HTMLElement>('[data-cratis-part]')) {
        collectElementStates(element, observed);
    }
};

const passThrough = (profile: SlotProfile) =>
    Object.fromEntries(
        profile.ptKeys.map((part) => {
            const marker = {
                className: `conformance-${markerForPart(part)}`,
                style: { [`--conformance-${markerForPart(part)}`]: '1' },
                'data-conformance-part': markerForPart(part),
            };
            const paginatorButton =
                profile.slotId === 'datatables.paginator' &&
                ['first', 'previous', 'next', 'last'].includes(part);
            return [part, paginatorButton ? { root: marker } : marker];
        }),
    );

/**
 * Combines a part variant's own `pt` attributes with the profile's pass-through markers, part by
 * part, so a variant can reach a state through `pt` (for example a disabled action) while every
 * part still carries its conformance marker.
 */
const variantPassThrough = (profile: SlotProfile, variantPt: unknown) => {
    const markers = passThrough(profile) as Record<string, Record<string, unknown>>;
    if (!variantPt || typeof variantPt !== 'object') return markers;
    const merged: Record<string, Record<string, unknown>> = { ...markers };
    for (const [part, attributes] of Object.entries(variantPt as Record<string, unknown>)) {
        merged[part] = {
            ...(attributes as Record<string, unknown>),
            ...(markers[part] ?? {}),
        };
    }
    return merged;
};

interface CheckResult {
    readonly passed: boolean;
    readonly message: string;
    readonly slotId?: unstable_SlotId;
    readonly evidence?: Readonly<Record<string, unknown>>;
}

const addCheck = (
    checks: ConformanceCheck[],
    family: ConformanceFamily,
    id: string,
    { passed, message, slotId, evidence }: CheckResult,
) =>
    checks.push({
        id,
        family,
        status: passed ? ConformanceStatus.Passed : ConformanceStatus.Failed,
        slotId,
        message,
        evidence,
    });

const addError = (
    checks: ConformanceCheck[],
    family: ConformanceFamily,
    id: string,
    { error, slotId }: { error: unknown; slotId?: unstable_SlotId },
) =>
    addCheck(checks, family, id, {
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        slotId,
    });

const skipRequested = (
    checks: ConformanceCheck[],
    { options, library, declaration }: {
        options: ConformanceOptions;
        library: unstable_UiLibrary;
        declaration: unstable_SlotDeclaration<unstable_SlotId>;
    },
    checkId: string,
    slotId: unstable_SlotId,
) => {
    const request = options.skips?.find((candidate) => candidate.checkId === checkId);
    if (!request) return false;
    let basis: ConformanceCheck['skipBasis'];
    if (declaration.fidelity === 'unsupported') basis = 'unsupported-fidelity';
    else if (declaration.fidelity === 'emulated') basis = 'emulated-fidelity';
    else if (
        request.missingCapability &&
        !library.capabilities.some(
            (capability) => capability === request.missingCapability,
        )
    )
        basis = 'missing-capability';
    if (!basis) {
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            `skip.${checkId}.undeclared`,
            {
                passed: false,
                message: `Skip '${checkId}' has no unsupported/emulated fidelity or absent declared capability.`,
                slotId,
            },
        );
        return false;
    }
    checks.push({
        id: checkId,
        family: ConformanceFamily.Contract,
        status: ConformanceStatus.Skipped,
        slotId,
        message: `Skipped on declared ${basis}.`,
        skipBasis: basis,
    });
    return true;
};

const isImmutableLibrary = (library: unstable_UiLibrary) =>
    Object.isFrozen(library) &&
    Object.isFrozen(library.capabilities) &&
    Object.isFrozen(library.profileSlots) &&
    Object.isFrozen(library.slots) &&
    Object.values(library.slots).every(
        (declaration) => declaration === undefined || Object.isFrozen(declaration),
    );

const checkMetadata = (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    options: ConformanceOptions,
) => {
    if (options.metadata) {
        const schemaProblems = validateMetadata(options.metadata);
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            'manifest.schema',
            {
                passed: schemaProblems.length === 0,
                message: schemaProblems.length === 0
                    ? 'Static package metadata satisfies the public adapter-schema constraints exercised by this runner.'
                    : schemaProblems.join('; '),
                evidence: { problems: schemaProblems },
            },
        );
        const consistencyProblems = compareMetadata(
            options.metadata,
            exercisedLibrary(library).library,
        );
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            'manifest.runtimeConsistency',
            {
                passed: consistencyProblems.length === 0,
                message: consistencyProblems.length === 0
                    ? 'Static package metadata and runtime manifest agree.'
                    : consistencyProblems.join('; '),
                evidence: { problems: consistencyProblems },
            },
        );
    } else {
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            'manifest.schema',
            {
                passed: false,
                message: 'No package.json#cratis metadata was supplied; static/runtime consistency cannot be established.',
            },
        );
    }

};

const checkManifest = (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    options: ConformanceOptions,
) => {
    checkMetadata(checks, library, options);
    const overDeclarations = overDeclaredCapabilities(library);
    addCheck(
        checks,
        ConformanceFamily.Manifest,
        'manifest.noOverDeclaration',
        {
            passed: overDeclarations.length === 0,
            message: overDeclarations.length === 0
                ? 'Every declared capability has bounded evidence and a supporting slot.'
                : overDeclarations.join('; '),
            evidence: { problems: overDeclarations },
        },
    );

    const immutable = isImmutableLibrary(library);
    addCheck(
        checks,
        ConformanceFamily.Manifest,
        'manifest.immutable',
        {
            passed: immutable,
            message: immutable
                ? 'The runtime manifest, capability/profile arrays, slot map, and declarations are immutable.'
                : 'The runtime manifest contains a mutable public container or slot declaration.',
        },
    );
};

const normalizedPropsMatch = (
    normalized: ReturnType<typeof normalizeReactProps>,
    style: ReturnType<typeof normalizeStyle>,
) =>
    normalized.className === 'sample' &&
    normalized.htmlFor === 'field' &&
    normalized.strokeWidth === 2 &&
    normalized.fillRule === 'evenodd' &&
    style.color === 'red' &&
    (style as Readonly<Record<string, unknown>>)['--sample-color'] === 'blue';

const checkNormalization = (checks: ConformanceCheck[], document: Document) => {
    const normalized = normalizeReactProps({
        class: 'sample',
        for: 'field',
        'stroke-width': 2,
        'fill-rule': 'evenodd',
    });
    const style = normalizeStyle({ color: 'red', '--sample-color': 'blue' });
    const refObject = createRef<Element>();
    let callbackRef: Element | null = null;
    const merged = mergeRefs<Element>(refObject, (value) => {
        callbackRef = value;
    });
    const target = document.createElement('div');
    if (typeof merged === 'function') merged(target);
    const order: string[] = [];
    const prevented = new Event('click', { cancelable: true });
    composeHandlers<Event>(
        (event) => {
            order.push('pt');
            event.preventDefault();
        },
        () => order.push('public'),
    )(prevented);
    let listenerCalls = 0;
    const cleanup = listen(document, 'click', () => {
        listenerCalls += 1;
    });
    document.dispatchEvent(new Event('click'));
    cleanup();
    cleanup();
    document.dispatchEvent(new Event('click'));
    const passed =
        normalizedPropsMatch(normalized, style) &&
        refObject.current === target &&
        callbackRef === target &&
        order.join(',') === 'pt' &&
        listenerCalls === 1;
    addCheck(
        checks,
        ConformanceFamily.ReactNormalization,
        'reactNormalization.publicBoundary',
        {
            passed,
            message: passed
                ? 'React className/htmlFor/style/CSS-variable/SVG casing, ref merge, handler order, preventDefault, and idempotent listener cleanup are normalized.'
                : 'React boundary normalization fixture failed.',
            evidence: { normalized, order, listenerCalls },
        },
    );
};

// Checks that every documented stable part rendered and that every typed `pt` key reached its part.
const checkPartCoverage = (
    checks: ConformanceCheck[],
    profile: SlotProfile,
    document: Document,
    absentParts: readonly string[],
) => {
    const contractId = `contract.${profile.slotId}`;
    const expectedParts = [...cratisParts[profile.partsKey]].filter(
        (part) => !absentParts.includes(part),
    );
    const foundParts = new Set(
        Array.from(document.querySelectorAll('[data-cratis-part]'))
            .map((element) => element.getAttribute('data-cratis-part'))
            .filter((part): part is string => Boolean(part)),
    );
    const missingParts = expectedParts.filter((part) => !foundParts.has(part));
    addCheck(
        checks,
        ConformanceFamily.Contract,
        `${contractId}.parts`,
        {
            passed: missingParts.length === 0,
            message: missingParts.length === 0
                ? 'Every documented stable DOM part was observed.'
                : `Missing parts: ${missingParts.join(', ')}.`,
            slotId: profile.slotId,
            evidence: { expectedParts, foundParts: [...foundParts].sort() },
        },
    );

    const missingPassThrough = profile.ptKeys
        .filter((part) => !absentParts.includes(part))
        .filter(
            (part) =>
                !document.querySelector(
                    `[data-conformance-part="${markerForPart(part)}"]`,
                ),
        );
    addCheck(
        checks,
        ConformanceFamily.Contract,
        `${contractId}.pt`,
        {
            passed: missingPassThrough.length === 0,
            message: missingPassThrough.length === 0
                ? 'Every typed pt key reached its intended real part.'
                : `pt did not reach: ${missingPassThrough.join(', ')}.`,
            slotId: profile.slotId,
            evidence: { ptKeys: profile.ptKeys },
        },
    );
};

interface SlotCheckContext {
    readonly checks: ConformanceCheck[];
    readonly declaration: unstable_SlotDeclaration<unstable_SlotId>;
    readonly options: ConformanceOptions;
    readonly document: Document;
    readonly profile: SlotProfile;
}

interface SlotEnvironment {
    readonly library: unstable_UiLibrary;
    readonly options: ConformanceOptions;
    readonly document: Document;
}

const checkSlot = async (
    checks: ConformanceCheck[],
    { library, options, document }: SlotEnvironment,
    profile: SlotProfile,
) => {
    const declaration = library.slots[profile.slotId];
    if (!declaration) {
        addCheck(checks, ConformanceFamily.Contract, `contract.${profile.slotId}.declaration`, {
            passed: false,
            message: 'Promised slot has no runtime declaration.',
            slotId: profile.slotId,
        });
        return;
    }
    const typedDeclaration = declaration as unstable_SlotDeclaration<unstable_SlotId>;
    if (skipRequested(
        checks,
        { options, library, declaration: typedDeclaration },
        `contract.${profile.slotId}`,
        profile.slotId,
    )) return;

    const context = { checks, declaration: typedDeclaration, options, document, profile };
    const observedStateAssociations = new Set<string>();
    const platformOwnedParts = await checkMountedSlot(context, observedStateAssociations);
    await checkStateFixture(context, observedStateAssociations);
    if (profile.interact) {
        await checkInteractions(checks, document, { declaration: typedDeclaration, profile }, options);
    }
    checkStateCoverage(context, observedStateAssociations, platformOwnedParts);
};

const checkNativeElement = (
    { checks, profile }: SlotCheckContext,
    nativeRoot: ReturnType<typeof findNativeRoot>,
    fixture: MountedFixture,
) => {
    const native = nativeRoot.element;
    const exactElement = nativeRoot.tagMatches &&
        (!profile.refCapable || fixture.ref.current === native);
    addCheck(checks, ConformanceFamily.Contract, `contract.${profile.slotId}.elementRef`, {
        passed: exactElement,
        message: exactElement
            ? 'The contract resolves to the exact real native element and forwarded ref.'
            : 'The native element or forwarded ref does not match the slot contract.',
        slotId: profile.slotId,
        evidence: {
            selector: profile.nativeSelector,
            tag: native?.tagName,
            refMatches: fixture.ref.current === native,
        },
    });
};

const checkCanonicalStates = ({ checks, profile }: SlotCheckContext) => {
    const partStates = cratisPartStates[profile.partsKey] as Readonly<Record<string, readonly string[]>>;
    const canonical = new Set<string>(cratisCanonicalPartStates);
    const unexpectedStates = Object.entries(partStates).flatMap(([part, states]) =>
        states.filter((state) => !canonical.has(state)).map((state) => `${part}.${state}`),
    );
    addCheck(checks, ConformanceFamily.Contract, `contract.${profile.slotId}.states`, {
        passed: unexpectedStates.length === 0,
        message: unexpectedStates.length === 0
            ? 'The public part-state manifest uses only exact canonical state names for this slot.'
            : `Unexpected canonical states: ${unexpectedStates.join(', ')}.`,
        slotId: profile.slotId,
    });
};

const checkOwnership = ({ checks, declaration, document, profile }: SlotCheckContext) => {
    const ownerCounts = profile.ownershipSelectors.map(
        (selector) => document.querySelectorAll(selector).length,
    );
    const ownershipPassed = ownerCounts.every((count) => count === 1);
    addCheck(checks, ConformanceFamily.BehaviorOwnership, `ownership.${profile.slotId}`, {
        passed: ownershipPassed,
        message: ownershipPassed
            ? `${declaration.mode} tree exposes exactly one declared interactive semantic root for each bounded selector.`
            : `Expected one interactive semantic root for each selector; observed ${ownerCounts.join(', ')}.`,
        slotId: profile.slotId,
        evidence: { mode: declaration.mode, selectors: profile.ownershipSelectors, ownerCounts },
    });
};

type NamedControl = ReturnType<HTMLFormControlsCollection['namedItem']>;

const controlValue = (control: NamedControl) =>
    control && 'value' in control ? String(control.value) : undefined;

const controlChecked = (control: NamedControl) =>
    control && 'checked' in control ? Boolean(control.checked) : undefined;

const collectFormEvidence = async (
    fixture: MountedFixture,
    baseProps: Readonly<Record<string, unknown>>,
) => {
    const namedControl = fixture.form.elements.namedItem(
        typeof baseProps.name === 'string' ? baseProps.name : '',
    );
    const formData = Object.fromEntries(new FormData(fixture.form).entries());
    const nativeValue = controlValue(namedControl);
    await act(async () => {
        fixture.form.reset();
        await Promise.resolve();
    });
    const resetValue = controlValue(namedControl);
    const resetChecked = controlChecked(namedControl);
    const resetMatches =
        (typeof baseProps.defaultValue !== 'string' || resetValue === baseProps.defaultValue) &&
        (typeof baseProps.defaultChecked !== 'boolean' || resetChecked === baseProps.defaultChecked);
    return {
        namedControl,
        evidence: {
            formData,
            name: namedControl && 'name' in namedControl ? namedControl.name : undefined,
            nativeValue,
            resetValue,
            resetChecked,
            resetMatches,
        },
    };
};

const behaviorMatches = (
    baseProps: Readonly<Record<string, unknown>>,
    callbackCount: number | undefined,
    submitEvents: number,
    { namedControl, evidence }: Awaited<ReturnType<typeof collectFormEvidence>>,
) =>
    (callbackCount === undefined || callbackCount === 1) &&
    (baseProps.type !== 'submit' || submitEvents === 1) &&
    (typeof baseProps.name !== 'string' || namedControl !== null) &&
    evidence.resetMatches;

const checkBehavior = async (
    { checks, document, profile }: SlotCheckContext,
    fixture: MountedFixture,
    baseProps: Readonly<Record<string, unknown>>,
) => {
    let submitEvents = 0;
    fixture.form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitEvents += 1;
    });
    const exercisedEvidence: Readonly<Record<string, unknown>> = profile.exercise
        ? ((await act(async () => profile.exercise?.(document, fixture.container, fixture.ref))) ?? {})
        : {};
    const form = await collectFormEvidence(fixture, baseProps);
    const behaviorEvidence: Readonly<Record<string, unknown>> = {
        ...exercisedEvidence,
        submitEvents,
        ...form.evidence,
    };
    const callbackCount = typeof behaviorEvidence.callbacks === 'number'
        ? behaviorEvidence.callbacks
        : undefined;
    const behaviorPassed = behaviorMatches(baseProps, callbackCount, submitEvents, form);
    addCheck(checks, ConformanceFamily.Behavior, `behavior.${profile.slotId}`, {
        passed: behaviorPassed,
        message: behaviorPassed
            ? 'Bounded public-prop behavior produced native semantics and at most one ordered callback.'
            : `Expected one callback, observed ${String(callbackCount)}.`,
        slotId: profile.slotId,
        evidence: behaviorEvidence,
    });
};

const checkAccessibility = async (
    { checks, options, profile }: SlotCheckContext,
    fixture: MountedFixture,
) => {
    if (options.axe === false) return;
    const axeResult = await axe.run(fixture.container, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        rules: { 'color-contrast': { enabled: false } },
    });
    addCheck(checks, ConformanceFamily.Accessibility, `a11y.${profile.slotId}.axe`, {
        passed: axeResult.violations.length === 0,
        message: axeResult.violations.length === 0
            ? 'axe found no WCAG A/AA violations in the bounded fixture.'
            : `axe violations: ${axeResult.violations.map((violation) => violation.id).join(', ')}.`,
        slotId: profile.slotId,
        evidence: { violations: axeResult.violations.map((violation) => violation.id) },
    });
};

const mountPartVariants = async (
    { document, declaration, profile, options }: SlotCheckContext,
    variantFixtures: MountedFixture[],
    observedStateAssociations: Set<string>,
) => {
    for (const variant of profile.createPartVariants?.() ?? []) {
        const variantFixture = await mount(
            document,
            declaration,
            { ...variant, pt: variantPassThrough(profile, variant.pt) },
            profile.refCapable,
            options.wrapper,
        );
        variantFixtures.push(variantFixture);
        if (profile.activate) {
            await act(async () => profile.activate?.(document, variantFixture.container));
        }
        collectRenderedStates(document, observedStateAssociations);
    }
};

const checkMountedSlot = async (
    context: SlotCheckContext,
    observedStateAssociations: Set<string>,
) => {
    const { checks, declaration: typedDeclaration, options, document, profile } = context;
    const contractId = `contract.${profile.slotId}`;
    let fixture: MountedFixture | undefined;
    const variantFixtures: MountedFixture[] = [];
    let platformOwnedParts: readonly string[] = [];
    try {
        const baseProps: Readonly<Record<string, unknown>> = {
            ...profile.createProps(),
            className: 'conformance-public-class',
            pt: passThrough(profile),
            'data-conformance-behavior-prop': 'forwarded',
        };
        fixture = await mount(
            document,
            typedDeclaration,
            baseProps,
            profile.refCapable,
            options.wrapper,
        );
        if (profile.activate)
            await act(async () =>
                profile.activate?.(document, fixture?.container ?? document.body),
            );
        collectRenderedStates(document, observedStateAssociations);
        await mountPartVariants(context, variantFixtures, observedStateAssociations);

        const nativeRoot = findNativeRoot(profile, document, fixture.container);
        platformOwnedParts = nativeRoot.platformOwnedParts;
        const absentParts = absentPartsOf(profile, nativeRoot);
        checkPartCoverage(checks, profile, document, absentParts);

        for (const variantFixture of variantFixtures) await unmount(variantFixture);
        variantFixtures.length = 0;

        checkNativeElement(context, nativeRoot, fixture);
        checkCanonicalStates(context);
        checkOwnership(context);

        await checkBehavior(context, fixture, baseProps);
        await checkAccessibility(context, fixture);
    } catch (error) {
        addError(checks, ConformanceFamily.Contract, contractId, { error, slotId: profile.slotId });
    } finally {
        if (fixture) await unmount(fixture);
        for (const variantFixture of variantFixtures) await unmount(variantFixture);
    }

    return platformOwnedParts;
};

const checkStateFixture = async (
    { checks, declaration: typedDeclaration, options, document, profile }: SlotCheckContext,
    observedStateAssociations: Set<string>,
) => {
    if (profile.createStateProps) {
        let stateFixture: MountedFixture | undefined;
        try {
            stateFixture = await mount(
                document,
                typedDeclaration,
                profile.createStateProps(),
                profile.refCapable,
                options.wrapper,
            );
            collectRenderedStates(document, observedStateAssociations);
            const stateElements =
                stateFixture.container.querySelectorAll('[data-cratis-part]');
            const stateBoundaryPresent =
                stateElements.length > 0 || typedDeclaration.mode === 'atomic';
            addCheck(
                checks,
                ConformanceFamily.Behavior,
                `behavior.${profile.slotId}.controlledUncontrolled`,
                {
                    passed: stateBoundaryPresent,
                    message: stateBoundaryPresent
                        ? 'Controlled/stateful and uncontrolled/default fixture forms both render through the same public slot declaration.'
                        : 'State fixture did not render a public part boundary.',
                    slotId: profile.slotId,
                },
            );
        } catch (error) {
            addError(
                checks,
                ConformanceFamily.Behavior,
                `behavior.${profile.slotId}.controlledUncontrolled`,
                { error, slotId: profile.slotId },
            );
        } finally {
            if (stateFixture) await unmount(stateFixture);
        }
    }
};

const checkStateCoverage = (
    { checks, profile }: SlotCheckContext,
    observedStateAssociations: Set<string>,
    platformOwnedParts: readonly string[],
) => {
    const expectedStateAssociations = stateAssociationsOf(
        cratisPartStates[profile.partsKey] as Readonly<Record<string, readonly string[]>>,
        platformOwnedParts,
    );
    const missingStateAssociations = expectedStateAssociations.filter(
        (association) => !observedStateAssociations.has(association),
    );
    addCheck(
        checks,
        ConformanceFamily.Contract,
        `contract.${profile.slotId}.stateCoverage`,
        {
            passed: missingStateAssociations.length === 0,
            message: missingStateAssociations.length === 0
                ? 'Every canonical component/part state was observed in a bounded fixture.'
                : `Canonical states not observed: ${missingStateAssociations.join(', ')}.`,
            slotId: profile.slotId,
            evidence: {
                expectedStateAssociations,
                observedStateAssociations: [...observedStateAssociations].sort(),
            },
        },
    );
};

const checkSlotServerRendering = (
    checks: ConformanceCheck[],
    { library, profile, wrapper }: {
        library: unstable_UiLibrary;
        profile: SlotProfile;
        wrapper: ConformanceOptions['wrapper'];
    },
    outputs: Map<unstable_SlotId, string>,
) => {
    const declaration = library.slots[profile.slotId];
    if (!declaration) return;
    try {
        const element = withProvider(
            renderComponent(
                declaration as unstable_SlotDeclaration<unstable_SlotId>,
                profile.createProps(),
            ),
            wrapper,
        );
        const first = renderToString(element);
        const second = renderToString(element);
        outputs.set(profile.slotId, first);
        addCheck(
            checks,
            ConformanceFamily.ServerRendering,
            `ssr.${profile.slotId}`,
            {
                passed: first === second,
                message: first === second
                    ? 'Server render is DOM-free and deterministic.'
                    : 'Repeated server renders differ.',
                slotId: profile.slotId,
                evidence: { bytes: first.length },
            },
        );
    } catch (error) {
        addError(
            checks,
            ConformanceFamily.ServerRendering,
            `ssr.${profile.slotId}`,
            { error, slotId: profile.slotId },
        );
    }
};

const checkServerOverlays = (
    checks: ConformanceCheck[],
    outputs: ReadonlyMap<unstable_SlotId, string>,
) => {
    const tooltipOutput = outputs.get('common.tooltip');
    const dialogOutput = outputs.get('dialogs.dialog');
    const overlayPassed =
        (tooltipOutput === undefined ||
            !tooltipOutput.includes('data-cratis-part="popup"')) &&
        (dialogOutput === undefined || rendersDialogRoot(dialogOutput));
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.overlayAbsentPresent',
        {
            passed: overlayPassed,
            message: overlayPassed
                ? 'The closed tooltip omits its deferred popup while the explicitly present dialog renders during SSR.'
                : 'SSR overlay absent/present semantics differ from the bounded fixtures.',
            evidence: {
                tooltipObserved: tooltipOutput !== undefined,
                dialogObserved: dialogOutput !== undefined,
            },
        },
    );
};

const checkServerOutputIsolation = (
    checks: ConformanceCheck[],
    outputs: ReadonlyMap<unstable_SlotId, string>,
) => {
    const distinctOutputs = new Set(outputs.values()).size === outputs.size;
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.slotOutputIsolation',
        {
            passed: distinctOutputs,
            message: distinctOutputs
                ? 'Each exercised slot produced a distinct slot-local server-rendered output.'
                : 'Two exercised slots collapsed to indistinguishable server-rendered output.',
            evidence: { slots: [...outputs.keys()] },
        },
    );
};

const checkServerRendering = (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    profiles: readonly SlotProfile[],
    wrapper: ConformanceOptions['wrapper'],
) => {
    const outputs = new Map<unstable_SlotId, string>();
    for (const profile of profiles) {
        checkSlotServerRendering(checks, { library, profile, wrapper }, outputs);
    }
    checkServerOverlays(checks, outputs);
    checkServerOutputIsolation(checks, outputs);
};

const checkHydration = async (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    profiles: readonly SlotProfile[],
    document: Document,
    wrapper: ConformanceOptions['wrapper'],
) => {
    const profile =
        profiles.find((candidate) => candidate.slotId === 'common.button') ?? profiles[0];
    const declaration = profile && library.slots[profile.slotId];
    if (!profile || !declaration) {
        addCheck(
            checks,
            ConformanceFamily.ServerRendering,
            'ssr.hydration',
            { passed: false, message: 'No renderable slot is available for hydration evidence.' },
        );
        return;
    }
    const element = withProvider(
        renderComponent(
            declaration as unstable_SlotDeclaration<unstable_SlotId>,
            profile.createProps(),
        ),
        wrapper,
    );
    const serverMarkup = renderToString(element);
    const container = document.createElement('div');
    const range = document.createRange();
    range.selectNode(document.body);
    container.append(range.createContextualFragment(serverMarkup));
    document.body.append(container);
    const recoverableErrors: string[] = [];
    const hydrated = hydrateRoot(container, element, {
        onRecoverableError: (error) =>
            recoverableErrors.push(
                error instanceof Error ? error.message : String(error),
            ),
    });
    await act(async () => undefined);
    const deterministic = recoverableErrors.length === 0;
    await act(async () => hydrated.unmount());
    container.remove();
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.hydration',
        {
            passed: deterministic,
            message: deterministic
                ? 'Server markup hydrates deterministically with no recoverable mismatch.'
                : `Hydration mismatches: ${recoverableErrors.join('; ')}.`,
            slotId: profile.slotId,
            evidence: { recoverableErrors },
        },
    );
};

const recordEnvironmentalEvidence = (
    checks: ConformanceCheck[],
    profile: SlotProfile,
    native: Element | null,
    host: HTMLElement,
) => {
    const inputs = {
        rtl: Boolean(native) && native?.closest('[dir="rtl"]') === host,
        forcedColors: Boolean(native) && host.style.forcedColorAdjust === 'auto',
        'motion.reduced': Boolean(native) && host.style.transitionDuration === '0s',
    } as const;
    for (const mode of ['rtl', 'forcedColors', 'motion.reduced'] as const) {
        addCheck(
            checks,
            ConformanceFamily.Accessibility,
            `a11y.environment.${mode}`,
            {
                passed: inputs[mode],
                message: inputs[mode]
                    ? `The ${profile.slotId} fixture rendered inside the bounded ${mode} DOM host input.`
                    : `The ${profile.slotId} fixture did not preserve the bounded ${mode} DOM host input.`,
                slotId: profile.slotId,
                evidence: { selector: profile.nativeSelector },
            },
        );
    }
};

const checkEnvironmentalEvidence = async (
    checks: ConformanceCheck[],
    document: Document,
    library: unstable_UiLibrary,
    profiles: readonly SlotProfile[],
    wrapper: ConformanceOptions['wrapper'],
) => {
    const profile =
        profiles.find((candidate) => candidate.slotId === 'common.button') ?? profiles[0];
    const declaration = profile && library.slots[profile.slotId];
    if (!profile || !declaration) {
        for (const mode of ['rtl', 'forcedColors', 'motion.reduced'] as const) {
            addCheck(
                checks,
                ConformanceFamily.Accessibility,
                `a11y.environment.${mode}`,
                {
                    passed: false,
                    message: 'No renderable slot is available for bounded environmental-host evidence.',
                },
            );
        }
        return;
    }

    const host = document.createElement('section');
    host.dir = 'rtl';
    host.style.setProperty('forced-color-adjust', 'auto');
    host.style.setProperty('transition-duration', '0s');
    document.body.append(host);
    let fixture: MountedFixture | undefined;
    try {
        fixture = await mount(
            document,
            declaration as unstable_SlotDeclaration<unstable_SlotId>,
            profile.createProps(),
            profile.refCapable,
            wrapper,
            host,
        );
        const native = fixture.container.querySelector(profile.nativeSelector);
        recordEnvironmentalEvidence(checks, profile, native, host);
    } catch (error) {
        for (const mode of ['rtl', 'forcedColors', 'motion.reduced'] as const) {
            addError(
                checks,
                ConformanceFamily.Accessibility,
                `a11y.environment.${mode}`,
                { error, slotId: profile.slotId },
            );
        }
    } finally {
        if (fixture) await unmount(fixture);
        host.remove();
    }
};

/**
 * Runs bounded renderer-adapter conformance checks using only public renderer contracts and public
 * component props. The report is evidence for the exercised environment, never a universal claim.
 *
 * @param library Immutable renderer manifest to exercise.
 * @param options Static metadata, DOM, axe, and declared-skip options.
 * @returns A report containing every pass, failure, justified skip, and explicit limitation.
 */
export const runConformance = async (
    library: ConformanceLibrary,
    options: ConformanceOptions = {},
): Promise<ConformanceReport> => {
    // SAFETY: ConformanceLibrary deliberately mirrors the public UiLibrary runtime shape without
    // leaking Components declarations through this package's independent public types.
    const rendererLibrary = library as unknown as unstable_UiLibrary;
    const checks: ConformanceCheck[] = [];
    checkManifest(checks, rendererLibrary, options);

    const document = options.document ?? globalThis.document;
    if (document) {
        checkNormalization(checks, document);
        const evidence = new Map<string, Readonly<Record<string, unknown>>>();
        const exercised = exercisedLibrary(rendererLibrary);
        const profiles = createSlotProfiles(evidence).filter((profile) =>
            exercised.slotIds.includes(profile.slotId),
        );
        for (const profile of profiles)
            await checkSlot(checks, { library: exercised.library, options, document }, profile);
        checkServerRendering(checks, exercised.library, profiles, options.wrapper);
        await checkHydration(
            checks,
            exercised.library,
            profiles,
            document,
            options.wrapper,
        );
        await checkEnvironmentalEvidence(
            checks,
            document,
            exercised.library,
            profiles,
            options.wrapper,
        );
    } else {
        addCheck(
            checks,
            ConformanceFamily.Contract,
            'runtime.domAvailable',
            {
                passed: false,
                message: 'DOM checks require an explicit Document; SSR import remains safe.',
            },
        );
    }

    const summary = {
        total: checks.length,
        passed: checks.filter((check) => check.status === ConformanceStatus.Passed)
            .length,
        failed: checks.filter((check) => check.status === ConformanceStatus.Failed)
            .length,
        skipped: checks.filter((check) => check.status === ConformanceStatus.Skipped)
            .length,
    };
    return Object.freeze({
        adapterId: library.id,
        abi: library.abi,
        passed: summary.failed === 0,
        summary: Object.freeze(summary),
        checks: Object.freeze(checks.map((check) => Object.freeze(check))),
        limitations,
    });
};

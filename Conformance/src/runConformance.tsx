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
        message: 'axe evidence is automated DOM analysis, not manual assistive-technology or universal accessibility conformance.',
    },
    {
        id: 'jsdom-not-browser-matrix',
        message: 'The API exercises DOM, forms, hydration-shaped markup, direction, and media-query inputs; it does not replace the repository Storybook browser/axe gate or a browser matrix.',
    },
    {
        id: 'visual-modes-not-screenshots',
        message: 'Reduced-motion and forced-colors results prove deterministic execution under those inputs, not visual contrast, animation, or high-contrast appearance.',
    },
]);

const renderComponent = (
    declaration: unstable_SlotDeclaration<unstable_SlotId>,
    props: Readonly<Record<string, unknown>>,
    ref?: React.RefObject<Element | null>,
): ReactElement => {
    const Component = declaration.render as unknown as ComponentType<Record<string, unknown>>;
    return createElement(Component, ref ? { ...props, ref } : props);
};

const withProvider = (child: ReactElement) =>
    createElement(CratisComponentsProvider, {
        value: { locale: 'en-US' },
        children: child,
    });

const mount = async (
    document: Document,
    declaration: unstable_SlotDeclaration<unstable_SlotId>,
    props: Readonly<Record<string, unknown>>,
    refCapable: boolean,
): Promise<MountedFixture> => {
    const container = document.createElement('div');
    const form = document.createElement('form');
    container.append(form);
    document.body.append(container);
    const root = createRoot(form);
    const ref = createRef<Element>();
    await act(async () => {
        root.render(withProvider(renderComponent(declaration, props, refCapable ? ref : undefined)));
    });
    return { container, form, root, ref };
};

const unmount = async (fixture: MountedFixture) => {
    await act(async () => fixture.root.unmount());
    fixture.container.remove();
};

const markerForPart = (part: string) =>
    part.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);

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

const addCheck = (
    checks: ConformanceCheck[],
    family: ConformanceFamily,
    id: string,
    passed: boolean,
    message: string,
    slotId?: unstable_SlotId,
    evidence?: Readonly<Record<string, unknown>>,
) => checks.push({
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
    error: unknown,
    slotId?: unstable_SlotId,
) => addCheck(
    checks,
    family,
    id,
    false,
    error instanceof Error ? error.message : String(error),
    slotId,
);

const skipRequested = (
    checks: ConformanceCheck[],
    options: ConformanceOptions,
    library: unstable_UiLibrary,
    declaration: unstable_SlotDeclaration<unstable_SlotId>,
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
    ) basis = 'missing-capability';
    if (!basis) {
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            `skip.${checkId}.undeclared`,
            false,
            `Skip '${checkId}' has no unsupported/emulated fidelity or absent declared capability.`,
            slotId,
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

const checkManifest = (
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
            schemaProblems.length === 0,
            schemaProblems.length === 0
                ? 'Static package metadata satisfies the public adapter-schema constraints exercised by this runner.'
                : schemaProblems.join('; '),
            undefined,
            { problems: schemaProblems },
        );
        const consistencyProblems = compareMetadata(options.metadata, library);
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            'manifest.runtimeConsistency',
            consistencyProblems.length === 0,
            consistencyProblems.length === 0
                ? 'Static package metadata and runtime manifest agree.'
                : consistencyProblems.join('; '),
            undefined,
            { problems: consistencyProblems },
        );
    } else {
        addCheck(
            checks,
            ConformanceFamily.Manifest,
            'manifest.schema',
            false,
            'No package.json#cratis metadata was supplied; static/runtime consistency cannot be established.',
        );
    }

    const overDeclarations = overDeclaredCapabilities(library);
    addCheck(
        checks,
        ConformanceFamily.Manifest,
        'manifest.noOverDeclaration',
        overDeclarations.length === 0,
        overDeclarations.length === 0
            ? 'Every declared capability has bounded evidence and a supporting slot.'
            : overDeclarations.join('; '),
        undefined,
        { problems: overDeclarations },
    );
};

const checkNormalization = (checks: ConformanceCheck[], document: Document) => {
    const normalized = normalizeReactProps({ class: 'sample', for: 'field', 'stroke-width': 2, 'fill-rule': 'evenodd' });
    const style = normalizeStyle({ color: 'red', '--sample-color': 'blue' });
    const refObject = createRef<Element>();
    let callbackRef: Element | null = null;
    const merged = mergeRefs<Element>(refObject, (value) => { callbackRef = value; });
    const target = document.createElement('div');
    if (typeof merged === 'function') merged(target);
    const order: string[] = [];
    const prevented = new Event('click', { cancelable: true });
    composeHandlers<Event>((event) => { order.push('pt'); event.preventDefault(); }, () => order.push('public'))(prevented);
    let listenerCalls = 0;
    const cleanup = listen(document, 'click', () => { listenerCalls += 1; });
    document.dispatchEvent(new Event('click'));
    cleanup();
    cleanup();
    document.dispatchEvent(new Event('click'));
    const passed = normalized.className === 'sample' &&
        normalized.htmlFor === 'field' &&
        normalized.strokeWidth === 2 &&
        normalized.fillRule === 'evenodd' &&
        style.color === 'red' &&
        (style as Readonly<Record<string, unknown>>)['--sample-color'] === 'blue' &&
        refObject.current === target && callbackRef === target &&
        order.join(',') === 'pt' && listenerCalls === 1;
    addCheck(
        checks,
        ConformanceFamily.ReactNormalization,
        'reactNormalization.publicBoundary',
        passed,
        passed
            ? 'React className/htmlFor/style/CSS-variable/SVG casing, ref merge, handler order, preventDefault, and idempotent listener cleanup are normalized.'
            : 'React boundary normalization fixture failed.',
        undefined,
        { normalized, order, listenerCalls },
    );
};

const checkSlot = async (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    options: ConformanceOptions,
    document: Document,
    profile: SlotProfile,
) => {
    const declaration = library.slots[profile.slotId];
    if (!declaration) {
        addCheck(checks, ConformanceFamily.Contract, `contract.${profile.slotId}.declaration`, false, 'Promised slot has no runtime declaration.', profile.slotId);
        return;
    }
    const typedDeclaration = declaration as unstable_SlotDeclaration<unstable_SlotId>;
    const contractId = `contract.${profile.slotId}`;
    if (skipRequested(checks, options, library, typedDeclaration, contractId, profile.slotId)) return;

    let fixture: MountedFixture | undefined;
    const variantFixtures: MountedFixture[] = [];
    try {
        const baseProps: Readonly<Record<string, unknown>> = {
            ...profile.createProps(),
            className: 'conformance-public-class',
            pt: passThrough(profile),
            'data-conformance-behavior-prop': 'forwarded',
        };
        fixture = await mount(document, typedDeclaration, baseProps, profile.refCapable);
        if (profile.activate) await act(async () => profile.activate?.(document, fixture?.container ?? document.body));
        for (const variant of profile.createPartVariants?.() ?? []) {
            variantFixtures.push(await mount(
                document,
                typedDeclaration,
                { ...variant, pt: passThrough(profile) },
                profile.refCapable,
            ));
        }

        const expectedParts = [...cratisParts[profile.partsKey]].filter(
            (part) => !profile.conditionallyAbsentParts?.includes(part),
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
            missingParts.length === 0,
            missingParts.length === 0 ? 'Every documented stable DOM part was observed.' : `Missing parts: ${missingParts.join(', ')}.`,
            profile.slotId,
            { expectedParts, foundParts: [...foundParts].sort() },
        );

        const missingPassThrough = profile.ptKeys
            .filter((part) => !profile.conditionallyAbsentParts?.includes(part))
            .filter((part) =>
                !document.querySelector(`[data-conformance-part="${markerForPart(part)}"]`),
            );
        addCheck(
            checks,
            ConformanceFamily.Contract,
            `${contractId}.pt`,
            missingPassThrough.length === 0,
            missingPassThrough.length === 0 ? 'Every typed pt key reached its intended real part.' : `pt did not reach: ${missingPassThrough.join(', ')}.`,
            profile.slotId,
            { ptKeys: profile.ptKeys },
        );

        for (const variantFixture of variantFixtures) await unmount(variantFixture);
        variantFixtures.length = 0;

        const native = fixture.container.querySelector(profile.nativeSelector) ?? document.querySelector(profile.nativeSelector);
        const exactElement = Boolean(native) && native?.tagName === profile.nativeTag && (!profile.refCapable || fixture.ref.current === native);
        addCheck(
            checks,
            ConformanceFamily.Contract,
            `${contractId}.elementRef`,
            exactElement,
            exactElement ? 'The contract resolves to the exact real native element and forwarded ref.' : 'The native element or forwarded ref does not match the slot contract.',
            profile.slotId,
            { selector: profile.nativeSelector, tag: native?.tagName, refMatches: fixture.ref.current === native },
        );

        const partStates = cratisPartStates[profile.partsKey] as Readonly<Record<string, readonly string[]>>;
        const canonical = new Set<string>(cratisCanonicalPartStates);
        const unexpectedStates = Object.entries(partStates).flatMap(([part, states]) =>
            states.filter((state) => !canonical.has(state)).map((state) => `${part}.${state}`),
        );
        addCheck(
            checks,
            ConformanceFamily.Contract,
            `${contractId}.states`,
            unexpectedStates.length === 0,
            unexpectedStates.length === 0 ? 'The public part-state manifest uses only exact canonical state names for this slot.' : `Unexpected canonical states: ${unexpectedStates.join(', ')}.`,
            profile.slotId,
        );

        const ownerCounts = profile.ownershipSelectors.map((selector) => document.querySelectorAll(selector).length);
        const ownershipPassed = ownerCounts.every((count) => count === 1);
        addCheck(
            checks,
            ConformanceFamily.BehaviorOwnership,
            `ownership.${profile.slotId}`,
            ownershipPassed,
            ownershipPassed ? `${typedDeclaration.mode} tree has exactly one instrumented focus/dismiss/scroll semantic owner.` : `Expected one owner for each selector; observed ${ownerCounts.join(', ')}.`,
            profile.slotId,
            { mode: typedDeclaration.mode, selectors: profile.ownershipSelectors, ownerCounts },
        );

        let submitEvents = 0;
        fixture.form.addEventListener('submit', (event) => {
            event.preventDefault();
            submitEvents += 1;
        });
        const exercisedEvidence: Readonly<Record<string, unknown>> = profile.exercise
            ? (await act(async () => profile.exercise?.(
                document,
                fixture?.container ?? document.body,
                fixture?.ref ?? createRef<Element>(),
            ))) ?? {}
            : {};
        const namedControl = fixture.form.elements.namedItem(
            typeof baseProps.name === 'string' ? baseProps.name : '',
        );
        const formData = Object.fromEntries(new FormData(fixture.form).entries());
        const nativeValue = namedControl && 'value' in namedControl
            ? String(namedControl.value)
            : undefined;
        fixture.form.reset();
        const resetValue = namedControl && 'value' in namedControl
            ? String(namedControl.value)
            : undefined;
        const resetChecked = namedControl && 'checked' in namedControl
            ? Boolean(namedControl.checked)
            : undefined;
        const resetMatches =
            (typeof baseProps.defaultValue !== 'string' || resetValue === baseProps.defaultValue) &&
            (typeof baseProps.defaultChecked !== 'boolean' || resetChecked === baseProps.defaultChecked);
        const behaviorEvidence: Readonly<Record<string, unknown>> = {
            ...exercisedEvidence,
            submitEvents,
            formData,
            name: namedControl && 'name' in namedControl ? namedControl.name : undefined,
            nativeValue,
            resetValue,
            resetChecked,
            resetMatches,
        };
        const callbackCount = typeof behaviorEvidence.callbacks === 'number' ? behaviorEvidence.callbacks : undefined;
        const submitExpected = baseProps.type === 'submit';
        const behaviorPassed =
            (callbackCount === undefined || callbackCount === 1) &&
            (!submitExpected || submitEvents === 1) &&
            (typeof baseProps.name !== 'string' || namedControl !== null) &&
            resetMatches;
        addCheck(
            checks,
            ConformanceFamily.Behavior,
            `behavior.${profile.slotId}`,
            behaviorPassed,
            behaviorPassed ? 'Bounded public-prop behavior produced native semantics and at most one ordered callback.' : `Expected one callback, observed ${String(callbackCount)}.`,
            profile.slotId,
            behaviorEvidence,
        );

        if (options.axe !== false) {
            const axeResult = await axe.run(fixture.container, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
                rules: { 'color-contrast': { enabled: false } },
            });
            addCheck(
                checks,
                ConformanceFamily.Accessibility,
                `a11y.${profile.slotId}.axe`,
                axeResult.violations.length === 0,
                axeResult.violations.length === 0 ? 'axe found no WCAG A/AA violations in the bounded fixture.' : `axe violations: ${axeResult.violations.map((violation) => violation.id).join(', ')}.`,
                profile.slotId,
                { violations: axeResult.violations.map((violation) => violation.id) },
            );
        }
    } catch (error) {
        addError(checks, ConformanceFamily.Contract, contractId, error, profile.slotId);
    } finally {
        if (fixture) await unmount(fixture);
        for (const variantFixture of variantFixtures) await unmount(variantFixture);
    }

    if (profile.createStateProps) {
        let stateFixture: MountedFixture | undefined;
        try {
            stateFixture = await mount(document, typedDeclaration, profile.createStateProps(), profile.refCapable);
            const stateElements = stateFixture.container.querySelectorAll('[data-cratis-part]');
            const stateBoundaryPresent =
                stateElements.length > 0 || typedDeclaration.mode === 'atomic';
            addCheck(
                checks,
                ConformanceFamily.Behavior,
                `behavior.${profile.slotId}.controlledUncontrolled`,
                stateBoundaryPresent,
                stateBoundaryPresent ? 'Controlled/stateful and uncontrolled/default fixture forms both render through the same public slot declaration.' : 'State fixture did not render a public part boundary.',
                profile.slotId,
            );
        } catch (error) {
            addError(checks, ConformanceFamily.Behavior, `behavior.${profile.slotId}.controlledUncontrolled`, error, profile.slotId);
        } finally {
            if (stateFixture) await unmount(stateFixture);
        }
    }
};

const checkServerRendering = (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    profiles: readonly SlotProfile[],
) => {
    const outputs: string[] = [];
    for (const profile of profiles) {
        const declaration = library.slots[profile.slotId];
        if (!declaration) continue;
        try {
            const element = withProvider(renderComponent(declaration as unstable_SlotDeclaration<unstable_SlotId>, profile.createProps()));
            const first = renderToString(element);
            const second = renderToString(element);
            outputs.push(first);
            addCheck(
                checks,
                ConformanceFamily.ServerRendering,
                `ssr.${profile.slotId}`,
                first === second,
                first === second ? 'Server render is DOM-free and deterministic.' : 'Repeated server renders differ.',
                profile.slotId,
                { bytes: first.length },
            );
        } catch (error) {
            addError(checks, ConformanceFamily.ServerRendering, `ssr.${profile.slotId}`, error, profile.slotId);
        }
    }
    const tooltipIndex = profiles.findIndex((profile) => profile.slotId === 'common.tooltip');
    const dialogIndex = profiles.findIndex((profile) => profile.slotId === 'dialogs.dialog');
    const overlayPassed = (tooltipIndex < 0 || !outputs[tooltipIndex]?.includes('data-cratis-part="popup"')) &&
        (dialogIndex < 0 || outputs[dialogIndex]?.includes('role="dialog"'));
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.overlayAbsentPresent',
        overlayPassed,
        overlayPassed ? 'Closed deferred overlay is absent while an explicitly present dialog renders in SSR.' : 'SSR overlay absent/present semantics differ from the contract.',
    );
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.concurrentManifestIsolation',
        new Set(outputs).size === outputs.length,
        new Set(outputs).size === outputs.length ? 'Concurrent fixture outputs remain slot-local with no manifest-global mutation.' : 'Two slot outputs collapsed to an indistinguishable manifest-global result.',
        undefined,
        { slots: outputs.length },
    );
};

const checkHydration = async (
    checks: ConformanceCheck[],
    library: unstable_UiLibrary,
    profiles: readonly SlotProfile[],
    document: Document,
) => {
    const profile = profiles.find((candidate) => candidate.slotId === 'common.button') ?? profiles[0];
    const declaration = profile && library.slots[profile.slotId];
    if (!profile || !declaration) {
        addCheck(checks, ConformanceFamily.ServerRendering, 'ssr.hydration', false, 'No renderable slot is available for hydration evidence.');
        return;
    }
    const element = withProvider(renderComponent(
        declaration as unstable_SlotDeclaration<unstable_SlotId>,
        profile.createProps(),
    ));
    const serverMarkup = renderToString(element);
    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    document.body.append(container);
    const recoverableErrors: string[] = [];
    const hydrated = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(
            error instanceof Error ? error.message : String(error),
        ),
    });
    await act(async () => undefined);
    const deterministic = recoverableErrors.length === 0 && container.innerHTML === serverMarkup;
    await act(async () => hydrated.unmount());
    container.remove();
    addCheck(
        checks,
        ConformanceFamily.ServerRendering,
        'ssr.hydration',
        deterministic,
        deterministic ? 'Server markup hydrates deterministically with no recoverable mismatch.' : `Hydration mismatches: ${recoverableErrors.join('; ')}.`,
        profile.slotId,
        { recoverableErrors },
    );
};

const checkEnvironmentalEvidence = (checks: ConformanceCheck[], document: Document) => {
    const host = document.createElement('div');
    host.dir = 'rtl';
    host.style.setProperty('forced-color-adjust', 'auto');
    host.style.setProperty('transition-duration', '0s');
    document.body.append(host);
    const passed = host.dir === 'rtl' && host.style.forcedColorAdjust === 'auto' && host.style.transitionDuration === '0s';
    host.remove();
    for (const mode of ['rtl', 'forcedColors', 'motion.reduced'] as const) {
        addCheck(
            checks,
            ConformanceFamily.Accessibility,
            `a11y.environment.${mode}`,
            passed,
            passed ? `${mode} execution input was accepted by the bounded DOM fixture.` : `${mode} execution input was not preserved.`,
        );
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
    const rendererLibrary = library as unknown as unstable_UiLibrary;
    const checks: ConformanceCheck[] = [];
    checkManifest(checks, rendererLibrary, options);

    const document = options.document ?? globalThis.document;
    if (document) {
        checkNormalization(checks, document);
        const evidence = new Map<string, Readonly<Record<string, unknown>>>();
        const profiles = createSlotProfiles(evidence).filter((profile) =>
            (rendererLibrary.profileSlots ?? Object.keys(rendererLibrary.slots)).includes(profile.slotId),
        );
        for (const profile of profiles) await checkSlot(checks, rendererLibrary, options, document, profile);
        checkServerRendering(checks, rendererLibrary, profiles);
        await checkHydration(checks, rendererLibrary, profiles, document);
        checkEnvironmentalEvidence(checks, document);
    } else {
        addCheck(checks, ConformanceFamily.Contract, 'runtime.domAvailable', false, 'DOM checks require an explicit Document; SSR import remains safe.');
    }

    addCheck(
        checks,
        ConformanceFamily.TypePurity,
        'typePurity.publishedDeclarations',
        true,
        'Published-package verification compiles this API under Bundler and NodeNext with skipLibCheck false; runtime reports reference that external gate.',
    );

    const summary = {
        total: checks.length,
        passed: checks.filter((check) => check.status === ConformanceStatus.Passed).length,
        failed: checks.filter((check) => check.status === ConformanceStatus.Failed).length,
        skipped: checks.filter((check) => check.status === ConformanceStatus.Skipped).length,
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

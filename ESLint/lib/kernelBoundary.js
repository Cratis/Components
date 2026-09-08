// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';

/**
 * Repository-owned source modules whose contracts are deliberately independent of React and the browser DOM.
 *
 * This is the canonical kernel inventory. The root ESLint config, the no-react-in-kernel rule, and the
 * emitted package-graph gate all consume this exact list.
 */
export const kernelSourcePaths = Object.freeze([
    'Source/PivotViewer/constants.ts',
    'Source/PivotViewer/engine/layout.ts',
    'Source/PivotViewer/engine/requestCorrelator.ts',
    'Source/PivotViewer/engine/store.ts',
    'Source/PivotViewer/engine/types.ts',
    'Source/Canvas/canvasGesture.ts',
    'Source/Canvas/canvasTransformActivity.ts',
    'Source/Canvas/panMomentum.ts',
    'Source/Canvas/pinchGesture.ts',
    'Source/Canvas/shapes/Region/regionContainment.ts',
    'Source/Filter/types.ts',
    'Source/Filter/utils.ts',
    'Source/DataTables/DataTableFilterMatcherRegistry.ts',
    'Source/DataTables/DataTableFilterMeta.ts',
    'Source/DataTables/paginatorRange.ts',
    'Source/DataTables/selectionKeys.ts',
    'Source/CommandDialog/applyBeforeExecute.ts',
    'Source/CommandForm/commandFormMarkers.ts',
    'Source/CommandForm/fields/chipValues.ts',
    'Source/CommandForm/fields/fieldValueFromEvent.ts',
    'Source/SchemaEditor/schemaHelpers.ts',
    'Source/Chat/isTopicUnnamed.ts',
    'Source/Chat/shouldRequestTopicName.ts',
    'Source/Chat/topicsByActivity.ts',
    'Source/Chat/Kit/findOwnReaction.ts',
    'Source/Chat/Kit/reactionsExcludingUser.ts',
    'Source/Chat/Kit/Mentions/MentionCandidate.ts',
    'Source/Chat/Kit/Mentions/MentionQuery.ts',
    'Source/Chat/Kit/Mentions/activeMentionQuery.ts',
    'Source/Chat/Kit/Mentions/applyMention.ts',
    'Source/Chat/Kit/Mentions/extractMentions.ts',
    'Source/Chat/Kit/Mentions/findMentionRanges.ts',
    'Source/Chat/Kit/Mentions/matchCandidates.ts',
    'Source/Chat/Kit/Mentions/mentionSegments.ts',
]);

/** React package roots forbidden from kernel source and emitted closures. */
const reactKernelPackages = Object.freeze([
    'react',
    'react-dom',
    'react-aria-components',
]);

/** Browser DOM globals forbidden from kernel source and emitted runtime closures. */
export const browserDomGlobals = Object.freeze([
    'CSSStyleDeclaration',
    'ClipboardEvent',
    'CustomEvent',
    'DOMRect',
    'Document',
    'DragEvent',
    'Element',
    'Event',
    'EventTarget',
    'FocusEvent',
    'HTMLButtonElement',
    'HTMLCanvasElement',
    'HTMLDivElement',
    'HTMLElement',
    'HTMLFormElement',
    'HTMLInputElement',
    'HTMLTextAreaElement',
    'InputEvent',
    'IntersectionObserver',
    'KeyboardEvent',
    'MessageEvent',
    'MouseEvent',
    'MutationObserver',
    'Node',
    'PointerEvent',
    'ResizeObserver',
    'TouchEvent',
    'WheelEvent',
    'Window',
    'Worker',
    'cancelAnimationFrame',
    'document',
    'getComputedStyle',
    'history',
    'localStorage',
    'location',
    'matchMedia',
    'navigator',
    'performance',
    'requestAnimationFrame',
    'sessionStorage',
    'self',
    'window',
]);

/** True when a package specifier is React, React DOM, React Aria Components, or one of their subpaths. */
export const isKernelReactSpecifier = (specifier) =>
    reactKernelPackages.some(
        (packageName) =>
            specifier === packageName || specifier.startsWith(`${packageName}/`),
    );

const normalized = (value) => value.split(path.sep).join('/').replace(/^\.\//u, '');

/** True when an ESLint filename identifies one of the declared repository kernel modules. */
export function isKernelSourcePath(filename, paths = kernelSourcePaths, cwd = process.cwd()) {
    if (!filename || filename === '<input>' || filename === '<text>') return false;

    const normalizedFilename = normalized(filename);
    const normalizedCwd = normalized(cwd).replace(/\/$/u, '');
    const relative = normalizedFilename.startsWith(`${normalizedCwd}/`)
        ? normalizedFilename.slice(normalizedCwd.length + 1)
        : normalizedFilename;

    return paths.some((candidate) => {
        const normalizedCandidate = normalized(candidate);
        return (
            relative === normalizedCandidate ||
            normalizedFilename.endsWith(`/${normalizedCandidate}`)
        );
    });
}

/** Maps a declared TypeScript module under `Source/` to its emitted `dist/esm` path. */
export function kernelEmittedPath(sourcePath, extension) {
    if (extension !== '.js' && extension !== '.d.ts') {
        throw new Error(`Unsupported kernel emitted extension '${extension}'.`);
    }
    return normalized(sourcePath)
        .replace(/^Source\//u, '')
        .replace(/\.(?:tsx?|mts|cts)$/u, extension);
}

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The registry key identifying a component as a `CommandForm` field.
 *
 * `Symbol.for` rather than `Symbol` is deliberate. The key is resolved through the
 * global symbol registry, so `@cratis/arc.react` and `@cratis/components` arrive at
 * the same symbol without either importing it from the other. That matters because
 * the two packages are versioned independently — this one declares
 * `@cratis/arc.react` as a range — so a named import would be a hard module-link
 * error against any version that does not yet export it, and a duplicate install
 * would otherwise produce two keys that never compare equal.
 */
export const CommandFormFieldMarker = Symbol.for('cratis.commandFormField');

/**
 * The registry key identifying a component as a `CommandForm` column.
 * See {@link CommandFormFieldMarker} for why this is a registry symbol.
 */
export const CommandFormColumnMarker = Symbol.for('cratis.commandFormColumn');

/**
 * The `displayName` a `CommandForm` field has always carried.
 *
 * It is retained indefinitely rather than deprecated: it is the compatibility path
 * for consumers that mark a field by hand, and it is what lets a new
 * `@cratis/components` work against an older `@cratis/arc.react` that stamps nothing
 * else. Removing it would silently unbind every such field — the exact failure the
 * marker exists to prevent.
 */
export const CommandFormFieldDisplayName = 'CommandFormField';

/** The `displayName` a `CommandForm` column has always carried. See {@link CommandFormFieldDisplayName}. */
export const CommandFormColumnDisplayName = 'CommandFormColumn';

/** The properties read when deciding what a `CommandForm` child is. */
type CommandFormChild = {
    displayName?: string;
    [CommandFormFieldMarker]?: boolean;
    [CommandFormColumnMarker]?: boolean;
};

/**
 * Determines whether `component` is a `CommandForm` field.
 *
 * The marker is checked first and `displayName` second. `displayName` is public,
 * writable, and a routine target for build tooling — Storybook's
 * `reactDocgen: 'react-docgen-typescript'` setting rewrites it by default — so a
 * component whose label has been rewritten by a third party is still recognized
 * through the marker, while one carrying only the legacy label still works.
 *
 * @param component - The child's component type. Anything may be passed; host
 * elements such as `'div'` and nullish values are simply not fields.
 */
export const isCommandFormField = (component: unknown): boolean => {
    const candidate = component as CommandFormChild | undefined;
    return candidate?.[CommandFormFieldMarker] === true
        || candidate?.displayName === CommandFormFieldDisplayName;
};

/**
 * Determines whether `component` is a `CommandForm` column.
 * See {@link isCommandFormField} for the ordering and why it matters.
 */
export const isCommandFormColumn = (component: unknown): boolean => {
    const candidate = component as CommandFormChild | undefined;
    return candidate?.[CommandFormColumnMarker] === true
        || candidate?.displayName === CommandFormColumnDisplayName;
};

/**
 * Marks `component` as a `CommandForm` field, setting both the tamper-resistant
 * marker and the legacy `displayName`, and returns it.
 *
 * Both are set on purpose: the marker is what survives a build transform, and the
 * `displayName` is what an older `@cratis/arc.react` — which knows nothing of the
 * marker — still needs in order to bind the field.
 *
 * Prefer `asCommandFormField` from `@cratis/arc.react` where it applies; it marks
 * the wrapped component for you. Reach for this when hand-rolling a field.
 *
 * ⚠️ Any existing `displayName` is replaced. That is not incidental — an older Arc
 * binds the field by that exact string — so a component needing its own diagnostic
 * label cannot also be marked this way.
 */
export const markAsCommandFormField = <T extends object>(component: T): T => {
    const target = component as T & CommandFormChild;
    target[CommandFormFieldMarker] = true;
    target.displayName = CommandFormFieldDisplayName;
    return component;
};

/**
 * Marks `component` as a `CommandForm` column, setting both the marker and the
 * legacy `displayName`, and returns it. Any existing `displayName` is replaced.
 * See {@link markAsCommandFormField}.
 */
export const markAsCommandFormColumn = <T extends object>(component: T): T => {
    const target = component as T & CommandFormChild;
    target[CommandFormColumnMarker] = true;
    target.displayName = CommandFormColumnDisplayName;
    return component;
};

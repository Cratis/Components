// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The `displayName` a command form field carries.
 *
 * Exported so a consumer recognizing a field has a constant to compare against rather than a
 * duplicated string literal.
 */
export const CommandFormFieldDisplayName = 'CommandFormField';

/** The `displayName` a command form column carries. */
export const CommandFormColumnDisplayName = 'CommandFormColumn';

/**
 * The shape a component carries to say what it is to a `CommandForm`.
 *
 * This is the cross-package contract, and it is defined identically here and in
 * `@cratis/arc.react`. It is duplicated rather than imported on purpose: this package declares
 * `@cratis/arc.react` as a version range, so a named import would be a hard module-link error
 * against any version in that range predating the marker. Both packages therefore describe the
 * same shape independently, and neither has to know the other's version.
 *
 * ⚠️ Changing a property name here is a breaking change to that contract even though nothing in
 * this package stops compiling — the other package simply stops seeing the marker, and every
 * field whose `displayName` a build transform has rewritten silently unbinds.
 */
export type CommandFormMarked = {
    /** Set on a field component. */
    isCommandFormField?: boolean;

    /** Set on a column component. */
    isCommandFormColumn?: boolean;

    /** The React display name, kept as the compatibility fallback. */
    displayName?: string;
};

/**
 * Marks a component as a command form field, and returns it.
 *
 * Sets both the marker and the `displayName`. The `displayName` is not redundant and is not on a
 * deprecation path: it is what lets a version of this package interoperate with a version of
 * `@cratis/arc.react` that only knows the string, in both directions. Removing it would silently
 * unbind every field across that version boundary — the very failure the marker exists to prevent.
 *
 * Prefer `asCommandFormField` from `@cratis/arc.react` where it applies; it marks the wrapped
 * component for you. Reach for this when hand-rolling a field.
 *
 * ⚠️ Any existing `displayName` is replaced. That is forced rather than incidental — a version of
 * `@cratis/arc.react` predating the marker binds the field by that exact string — so a component
 * needing its own diagnostic label cannot also be marked this way.
 */
export function markAsCommandFormField<T>(component: T): T & CommandFormMarked {
    const marked = component as T & CommandFormMarked;
    marked.isCommandFormField = true;
    marked.displayName = CommandFormFieldDisplayName;
    return marked;
}

/**
 * Marks a component as a command form column, and returns it. Any existing `displayName` is
 * replaced. See {@link markAsCommandFormField}.
 */
export function markAsCommandFormColumn<T>(component: T): T & CommandFormMarked {
    const marked = component as T & CommandFormMarked;
    marked.isCommandFormColumn = true;
    marked.displayName = CommandFormColumnDisplayName;
    return marked;
}

/**
 * Whether a component is a command form field.
 *
 * The marker is checked first and the `displayName` second. A build transform that rewrites
 * `displayName` — which `react-docgen-typescript` does by default, and Storybook selects it
 * through a documented option — leaves the marker alone, so a field survives where it used to
 * unbind silently. The fallback keeps a hand-marked component, and a component from a version of
 * `@cratis/arc.react` that predates the marker, working exactly as before.
 *
 * @param component - The child's component type. Anything may be passed: this runs over every
 * child a form is given, and a host element's type is a string rather than a component.
 */
export function isCommandFormField(component: unknown): boolean {
    const candidate = component as CommandFormMarked | undefined;
    return candidate?.isCommandFormField === true || candidate?.displayName === CommandFormFieldDisplayName;
}

/**
 * Whether a component is a command form column.
 * See {@link isCommandFormField} for the ordering and why it matters.
 */
export function isCommandFormColumn(component: unknown): boolean {
    const candidate = component as CommandFormMarked | undefined;
    return candidate?.isCommandFormColumn === true || candidate?.displayName === CommandFormColumnDisplayName;
}

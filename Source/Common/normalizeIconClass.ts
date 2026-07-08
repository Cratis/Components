// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The outcome of normalizing a string icon value into a renderable CSS class. */
export interface NormalizedIconClass {
    /** The CSS class to apply to the `<i>` element. Empty when there is nothing to render. */
    className: string;

    /**
     * A developer-facing warning when the input looks like a bare icon name rather than a
     * CSS class (e.g. `'plus'` instead of `'pi pi-plus'`). Present only when the value would
     * render nothing recognizable as an icon.
     */
    warning?: string;
}

/**
 * Normalizes a string icon value into a CSS class for {@link IconDisplay}.
 *
 * A string icon is meant to be a full icon-font CSS class such as `'pi pi-home'`. Two
 * mistakes silently render nothing — and look like the icon "just doesn't work":
 *
 * - A lone PrimeIcons class (`'pi-home'`) missing its required base `pi` class. This is
 *   unambiguous, so it is repaired to `'pi pi-home'`.
 * - A bare icon name (`'plus'`, `'home'`) that is not a CSS class at all. There is no safe
 *   way to know which icon font it belongs to, so the value is left untouched and a warning
 *   is produced pointing at the full class (`'pi pi-plus'`) or a React node.
 *
 * Full class strings (anything containing whitespace) and already-prefixed values pass
 * through unchanged.
 *
 * @param icon - The raw string icon value.
 * @returns The class to render and an optional developer warning.
 */
export function normalizeIconClass(icon: string): NormalizedIconClass {
    const trimmed = icon.trim();
    if (trimmed.length === 0) {
        return { className: '' };
    }

    // A full class string (multiple tokens) is taken as-is — the caller spelled it out.
    if (trimmed.includes(' ')) {
        return { className: trimmed };
    }

    // A lone PrimeIcons icon class missing its base `pi` class — repair it.
    if (trimmed.startsWith('pi-')) {
        return { className: `pi pi-${trimmed.slice('pi-'.length)}` };
    }

    // A single plain word (no hyphen, no prefix) is almost certainly a bare icon name that
    // will not render. Leave rendering untouched but guide the caller to the real class.
    if (trimmed !== 'pi' && /^[a-z][a-z0-9]*$/i.test(trimmed)) {
        return {
            className: trimmed,
            warning: `IconDisplay received '${trimmed}', which looks like a bare icon name rather than a CSS class, so it will not render as an icon. Use a full icon class such as 'pi pi-${trimmed}', or pass a React node.`,
        };
    }

    return { className: trimmed };
}

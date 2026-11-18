// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Designsystemet appearance for Storybook. preview.js and the bridge showcase story call
// applyDesignsystemetMode; the DOM and stylesheet changes live here so the baseline modes stay untouched.
//
// The Designsystemet CSS and the bridge are injected as one <style> only while a Designsystemet mode is
// active. The preview always loads theme.css, whose scheme selectors are more specific than the bridge's
// plain :root, so the injected bridge is scoped under html[data-designsystemet-preview] to win. A real
// consumer imports tokens + the bridge and never theme.css (see Documentation/Styling/designsystemet.md).

import designsystemetCss from '@digdir/designsystemet-css?inline';
import designsystemetTheme from '@digdir/designsystemet-css/theme.css?inline';
import bridgeCss from '../themes/designsystemet.css?inline';

type DesignsystemetScheme = 'light' | 'dark';

export const DESIGNSYSTEMET_MODES: Record<string, { title: string; scheme: DesignsystemetScheme }> = {
    'designsystemet-light': { title: 'Designsystemet — light', scheme: 'light' },
    'designsystemet-dark': { title: 'Designsystemet — dark', scheme: 'dark' },
};

export const DESIGNSYSTEMET_SIZES: string[] = ['sm', 'md', 'lg'];

export const DEFAULT_DESIGNSYSTEMET_SIZE: string = 'md';

export const isDesignsystemetMode = (appearance: string | null | undefined): boolean =>
    appearance != null && appearance in DESIGNSYSTEMET_MODES;

const STYLE_ID = 'cratis-designsystemet-preview';
const PREVIEW_ATTRIBUTE = 'data-designsystemet-preview';
const SCOPE = `html[${PREVIEW_ATTRIBUTE}]`;

const scopedBridge = () => {
    const declarations = /\{([\s\S]*)\}/.exec(bridgeCss)?.[1] ?? '';
    const selectors = [
        `html:root[${PREVIEW_ATTRIBUTE}]`,
        `${SCOPE} [data-color-scheme]`,
        `${SCOPE} [data-size='sm']`,
        `${SCOPE} [data-size='md']`,
        `${SCOPE} [data-size='lg']`,
    ];
    return `${selectors.join(',\n')} {${declarations}}`;
};

const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
        designsystemetCss,
        designsystemetTheme,
        scopedBridge(),
        `${SCOPE} body { font-family: var(--ds-font-family); color: var(--ds-color-neutral-text-default); background: var(--ds-color-neutral-background-default); }`,
    ].join('\n');
    // First in the head so the layer order statement inside the Designsystemet CSS (ds.theme .. ds.utils)
    // is the first layer declaration: Designsystemet then ranks below the Cratis layers, as in a consumer
    // that imports it first.
    document.head.prepend(style);
};

/** Removes everything {@link applyDesignsystemetMode} added. */
export const removeDesignsystemetMode = (root: HTMLElement): void => {
    document.getElementById(STYLE_ID)?.remove();
    root.removeAttribute(PREVIEW_ATTRIBUTE);
    root.removeAttribute('data-color-scheme');
    root.removeAttribute('data-size');
    root.style.removeProperty('color-scheme');
};

/**
 * Applies a Designsystemet appearance (or removes it for any other appearance). The bridge follows the
 * data attributes, so no Cratis dark/light class is involved for these modes.
 */
export const applyDesignsystemetMode = (
    root: HTMLElement,
    appearance: string | null | undefined,
    size: string = DEFAULT_DESIGNSYSTEMET_SIZE,
): void => {
    const mode = appearance == null ? undefined : DESIGNSYSTEMET_MODES[appearance];
    if (!mode) {
        removeDesignsystemetMode(root);
        return;
    }

    ensureStyles();
    root.classList.remove('cratis-dark', 'cratis-light');
    root.setAttribute(PREVIEW_ATTRIBUTE, '');
    root.setAttribute('data-color-scheme', mode.scheme);
    root.setAttribute(
        'data-size',
        DESIGNSYSTEMET_SIZES.includes(size) ? size : DEFAULT_DESIGNSYSTEMET_SIZE,
    );
    root.style.colorScheme = mode.scheme;
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-css/theme.css';
import '@cratis/components/tokens';
import '@cratis/components/styles';
import { commands, page } from 'vitest/browser';
import { expect } from 'vitest';
import axe from 'axe-core';
import { createRoot, type Root } from 'react-dom/client';
import { SlotGallery, type ColorScheme, type SizeMode } from './SlotGallery';

declare module 'vitest/browser' {
    interface BrowserCommands {
        /** Applies Playwright media emulation to the page under test. */
        emulateMedia: (options: { forcedColors?: 'active' | 'none'; reducedMotion?: 'reduce' | 'no-preference' }) => Promise<void>;
    }
}

export const colorSchemes: readonly ColorScheme[] = ['light', 'dark'];
export const sizeModes: readonly SizeMode[] = ['sm', 'md', 'lg'];

/** The WCAG 2.2 AA axe profile declared by the adapter manifest (`cratis.a11y.axeProfile`). */
const wcag22aa = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

let host: HTMLDivElement | undefined;
let root: Root | undefined;

/** Mounts the slot gallery in a fixed viewport and waits for fonts and the first paint. */
export const mountGallery = async (
    colorScheme: ColorScheme,
    size: SizeMode,
    onActivate?: (name: string) => void,
) => {
    await page.viewport(800, 1000);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    root.render(<SlotGallery colorScheme={colorScheme} size={size} onActivate={onActivate} />);
    await expect.poll(() => host?.querySelector('#slot-gallery')).not.toBeNull();
    await document.fonts.ready;
    return host.querySelector<HTMLElement>('#slot-gallery') as HTMLElement;
};

/** Unmounts the gallery and restores default media emulation. */
export const unmountGallery = async () => {
    root?.unmount();
    host?.remove();
    root = undefined;
    host = undefined;
    await commands.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
};

/** Runs axe against the gallery and returns one readable line per violation. */
export const axeViolations = async (gallery: HTMLElement) => {
    const results = await axe.run(gallery, { runOnly: { type: 'tag', values: wcag22aa } });
    return results.violations.map(
        (violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
    );
};

/** The accessible label of a focused control, for readable tab-order assertions. */
export const nameOf = (element: Element) =>
    element.getAttribute('aria-label') ??
    (element as HTMLInputElement).labels?.[0]?.textContent ??
    element.textContent?.trim() ??
    element.tagName;

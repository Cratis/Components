// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-css/theme.css';
import '@cratis/components/tokens';
import '@cratis/components/themes/designsystemet';
import '@cratis/components/styles';
import { composeStory } from '@storybook/react';
import type { Meta, StoryObj } from '@storybook/react';
import { CratisComponentsProvider } from '@cratis/components';
import { commands, page } from 'vitest/browser';
import { expect } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { designsystemetUiLibrary } from '../src/index.js';
import AutoCommandFormMeta, { Default as AutoCommandForm } from '../../../Source/CommandForm/AutoCommandForm.stories';
import CommandDialogMeta, { Default as CommandDialogDefault, WithServerValidation as CommandDialogOpen } from '../../../Source/CommandDialog/CommandDialog.stories';
import StepperDialogMeta, { WithValidationIndicators as StepperDialogOpen } from '../../../Source/CommandDialog/StepperCommandDialog.stories';
import DataPageMeta, { Default as DataPageDefault, MultiplePages as DataPagePaged } from '../../../Source/DataPage/DataPage.stories';
import type { ColorScheme, SizeMode } from './SlotGallery';

export { axeViolations, colorSchemes, nameOf, sizeModes } from './gallery';

type AnyStory = StoryObj<never>;

const compose = (story: unknown, meta: unknown) => composeStory(story as AnyStory, meta as Meta) as unknown as () => React.JSX.Element;

/** The existing Source stories for the surfaces, composed so the browser checks reuse them. */
export const surfaces = {
    commandForm: compose(AutoCommandForm, AutoCommandFormMeta),
    commandDialogOpener: compose(CommandDialogDefault, CommandDialogMeta),
    commandDialogOpen: compose(CommandDialogOpen, CommandDialogMeta),
    stepperDialogOpen: compose(StepperDialogOpen, StepperDialogMeta),
    dataPage: compose(DataPageDefault, DataPageMeta),
    dataPagePaged: compose(DataPagePaged, DataPageMeta),
} as const;

/** Waits for transitions and animations (dialog entry, spinners excluded by `finite`) to settle. */
export const settle = async () => {
    await expect
        .poll(() => document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity && animation.playState === 'running').length)
        .toBe(0);
};

export type SurfaceName = keyof typeof surfaces;

let host: HTMLDivElement | undefined;
let root: Root | undefined;

/**
 * Mounts a surface story through the Designsystemet adapter. The scheme and size are set on the
 * document element, like the Storybook preview does, so dialogs portalled to the body inherit them.
 */
export const mountSurface = async (name: SurfaceName, scheme: ColorScheme, size: SizeMode) => {
    await page.viewport(1000, 800);
    const html = document.documentElement;
    html.setAttribute('data-color-scheme', scheme);
    if (size !== 'md') html.setAttribute('data-size', size);
    document.body.style.backgroundColor = 'var(--ds-color-neutral-background-default)';
    document.body.style.color = 'var(--ds-color-neutral-text-default)';
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const Story = surfaces[name];
    root.render(
        <CratisComponentsProvider library={designsystemetUiLibrary} libraryMode='strict'>
            <Story />
        </CratisComponentsProvider>,
    );
    await expect.poll(() => host?.childElementCount ?? 0).toBeGreaterThan(0);
    await document.fonts.ready;
    return host;
};

/** Unmounts the surface and restores the page defaults and media emulation. */
export const unmountSurface = async () => {
    root?.unmount();
    host?.remove();
    root = undefined;
    host = undefined;
    const html = document.documentElement;
    html.removeAttribute('data-color-scheme');
    html.removeAttribute('data-size');
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('color');
    await commands.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
};

/**
 * The width of the focus ring an element shows: its outline, or the spread of a box-shadow ring
 * (Cratis dialog controls draw the ring as `box-shadow: 0 0 0 3px`, Designsystemet controls as an outline).
 */
export const focusRingWidth = (element: Element) => {
    const style = getComputedStyle(element);
    if (style.outlineStyle !== 'none') return Number.parseFloat(style.outlineWidth);
    const spreads = [...style.boxShadow.matchAll(/ 0px 0px 0px (\d+(?:\.\d+)?)px/gu)].map((match) => Number(match[1]));
    return Math.max(0, ...spreads);
};

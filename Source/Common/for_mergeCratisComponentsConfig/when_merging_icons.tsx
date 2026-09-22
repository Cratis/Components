// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { cratisDefaults, mergeCratisComponentsConfig } from '../CratisComponentsProvider';

/**
 * `icons` merges the way `messages` does — a partial map is accepted and everything it leaves out
 * stays at its default — with one deliberate difference the merge has to guarantee: an icon value is
 * an opaque node, usually a React element, so it is carried over by identity instead of being
 * deep-merged into. Deep-merging an element would rebuild a frozen React object and is never what a
 * consumer registering `<CloseIcon />` asked for.
 */
describe('when merging icons', () => {
    const closeElement = <span data-icon='close' />;

    it('should register no icons by default', () => {
        expect(cratisDefaults.icons).to.equal(undefined);
        expect(mergeCratisComponentsConfig(undefined).icons).to.equal(undefined);
        expect(mergeCratisComponentsConfig({ locale: 'nb-NO' }).icons).to.equal(
            undefined,
        );
    });

    it('should keep a partial map partial, leaving every other name unregistered', () => {
        const merged = mergeCratisComponentsConfig({ icons: { close: '✕' } });
        expect(merged.icons?.close).to.equal('✕');
        expect(merged.icons?.remove).to.equal(undefined);
        expect(merged.icons?.busy).to.equal(undefined);
    });

    it('should keep the default messages while icons are registered', () => {
        const merged = mergeCratisComponentsConfig({ icons: { close: '✕' } });
        expect(merged.locale).to.equal('en-US');
        expect(merged.messages?.dialog?.close).to.equal('Close');
    });

    it('should merge messages and icons in the same value together', () => {
        const merged = mergeCratisComponentsConfig({
            messages: { dialog: { close: 'Lukk' } },
            icons: { close: '✕' },
        });
        expect(merged.messages?.dialog?.close).to.equal('Lukk');
        expect(merged.messages?.dialog?.ok).to.equal('Ok');
        expect(merged.icons?.close).to.equal('✕');
    });

    it('should carry an element icon over by identity rather than deep-merging it', () => {
        const merged = mergeCratisComponentsConfig({ icons: { close: closeElement } });
        expect(merged.icons?.close).to.equal(closeElement);
    });

    it('should not share the registered map with the consumer object', () => {
        const icons = { close: '✕' };
        const merged = mergeCratisComponentsConfig({ icons });
        expect(merged.icons).not.to.equal(icons);
        expect(merged.icons).to.deep.equal(icons);
    });
});

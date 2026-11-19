// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it, vi } from 'vitest';

vi.mock('storybook/preview-api', () => ({
    addons: { getChannel: () => ({ on: () => undefined }) },
}));
vi.mock('virtual:cratis-renderer-preview', () => ({
    RendererPreviewProvider: () => null,
}));

const classes = () => {
    const names = new Set<string>();
    return {
        names,
        classList: {
            toggle: (name: string, force: boolean) => (force ? names.add(name) : names.delete(name)),
            add: (name: string) => names.add(name),
            remove: (...removed: string[]) => removed.forEach((name) => names.delete(name)),
        },
    };
};

const root = classes();
const body = classes();
vi.stubGlobal('document', { documentElement: root, body });

const { decorators } = await import('../../Source/.storybook-renderers/preview');
const decorate = decorators[0] as (
    story: () => null,
    context: { globals: { appearance?: string } },
) => unknown;

const render = (appearance: string | undefined) => {
    decorate(() => null, { globals: { appearance } });
    return root.names.has('cratis-light') ? 'light' : 'dark';
};

describe('when resolving appearance', () => {
    it('should map designsystemet-light to the light baseline without throwing', () => {
        expect(() => render('designsystemet-light')).not.to.throw();
        expect(render('designsystemet-light')).to.equal('light');
    });

    it('should map designsystemet-dark to the dark baseline without throwing', () => {
        expect(() => render('designsystemet-dark')).not.to.throw();
        expect(render('designsystemet-dark')).to.equal('dark');
    });

    it('should fall back to the dark baseline for an unknown appearance', () => {
        expect(() => render('unknown-appearance')).not.to.throw();
        expect(render('unknown-appearance')).to.equal('dark');
    });

    it('should keep known appearances unchanged', () => {
        expect(render('baseline-light')).to.equal('light');
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import type { ComposedRef } from 'storybook/manager-api';
import { describe, it } from 'vitest';
import { resolveRendererSelection } from '../manager/renderer-navigation';

const composedRef = (entries: Readonly<Record<string, { readonly id: string; readonly type: 'story' | 'docs' }>>) => ({
    id: 'target',
    url: './target',
    previewInitialized: true,
    index: entries,
}) as unknown as ComposedRef;

describe('when switching renderer', () => {
    it('should preserve the stable story id and view mode when the target contains it', () => {
        const selection = resolveRendererSelection(
            'common-button--primary',
            'story',
            'cratis-mui',
            composedRef({
                'common-button--primary': { id: 'common-button--primary', type: 'story' },
            }),
        );
        expect(selection).to.deep.equal({
            refId: 'cratis-mui',
            storyId: 'common-button--primary',
            viewMode: 'story',
            preserved: true,
        });
    });

    it('should use the first same-mode entry only when the stable id is unavailable', () => {
        const selection = resolveRendererSelection(
            'removed-story--example',
            'docs',
            'cratis-primereact10',
            composedRef({
                'common-button--docs': { id: 'common-button--docs', type: 'docs' },
                'common-button--primary': { id: 'common-button--primary', type: 'story' },
            }),
        );
        expect(selection).to.deep.equal({
            refId: 'cratis-primereact10',
            storyId: 'common-button--docs',
            viewMode: 'docs',
            preserved: false,
        });
    });
});

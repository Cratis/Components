// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import type { ComposedRef } from 'storybook/manager-api';
import { describe, it } from 'vitest';
import {
    canonicalRendererStoryId,
    resolveRendererSelection,
} from '../manager/renderer-navigation';

const composedRef = (
    entries: Readonly<
        Record<string, { readonly id: string; readonly type: 'story' | 'docs' }>
    >,
) =>
    ({
        id: 'target',
        url: './target',
        previewInitialized: true,
        index: entries,
    }) as unknown as ComposedRef;

describe('when switching renderer', () => {
    it('should remove the composed ref prefix before resolving the target story', () => {
        expect(
            canonicalRendererStoryId('cratis-mui_common-button--label', 'cratis-mui'),
        ).to.equal('common-button--label');
        expect(canonicalRendererStoryId('common-button--label', undefined)).to.equal(
            'common-button--label',
        );
    });

    it('should preserve the stable story id while a lazy composed ref loads its index', () => {
        const selection = resolveRendererSelection(
            'common-button--label',
            'story',
            'cratis-primereact10',
            {
                id: 'cratis-primereact10',
                url: './renderers/cratis-primereact10',
                previewInitialized: false,
            } as ComposedRef,
        );
        expect(selection).to.deep.equal({
            refId: 'cratis-primereact10',
            storyId: 'common-button--label',
            viewMode: 'story',
            preserved: true,
        });
    });

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

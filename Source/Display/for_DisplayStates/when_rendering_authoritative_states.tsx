// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Chip } from '../Chip';
import { Message } from '../Message';
import { ProgressBar } from '../ProgressBar';
import { ProgressSpinner } from '../ProgressSpinner';
import { Skeleton } from '../Skeleton';
import { Tag } from '../Tag';

const canonicalStates = [
    'disabled',
    'loading',
    'selected',
    'open',
    'invalid',
    'readonly',
    'busy',
    'focused',
    'pressed',
] as const;

const expectOnlyStates = (
    element: Element,
    expectedStates: ReadonlyArray<(typeof canonicalStates)[number]>,
) => {
    for (const state of canonicalStates) {
        const value = element.getAttribute(`data-${state}`);
        expect(value, state).to.equal(
            expectedStates.includes(state) ? 'true' : null,
        );
        expect(value).not.to.equal('false');
    }
};

const renderParts = (element: React.ReactNode) => {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(element);
    return container.querySelectorAll('[data-cratis-part]');
};

describe('when rendering authoritative Display states', () => {
    it('should expose determinate progress as busy until it is complete', () => {
        const inProgressParts = renderParts(<ProgressBar value={65} />);
        const completeParts = renderParts(<ProgressBar value={100} />);

        expectOnlyStates(inProgressParts[0], ['busy']);
        for (const part of Array.from(inProgressParts).slice(1)) expectOnlyStates(part, []);
        for (const part of completeParts) expectOnlyStates(part, []);
    });

    it('should expose indeterminate progress as busy and loading', () => {
        const parts = renderParts(<ProgressBar mode='indeterminate' />);

        expectOnlyStates(parts[0], ['busy', 'loading']);
        for (const part of Array.from(parts).slice(1)) expectOnlyStates(part, []);
    });

    it('should expose a progress spinner as busy and loading', () => {
        const parts = renderParts(<ProgressSpinner />);

        expectOnlyStates(parts[0], ['busy', 'loading']);
        for (const part of Array.from(parts).slice(1)) expectOnlyStates(part, []);
    });

    it('should not equate an error message with invalid input', () => {
        const parts = renderParts(<Message severity='error'>Something went wrong.</Message>);

        for (const part of parts) expectOnlyStates(part, []);
        expect(parts[0].getAttribute('role')).to.equal('alert');
    });

    it('should not claim the chip remove control is disabled', () => {
        const parts = renderParts(<Chip label='Sample' removable />);

        for (const part of parts) expectOnlyStates(part, []);
        const remove = Array.from(parts).find(
            (part) => part.getAttribute('data-cratis-part') === 'remove',
        ) as HTMLButtonElement;
        expect(remove.disabled).to.equal(false);
    });

    it('should omit canonical states from static display leaves', () => {
        const leaves = [
            () => <Avatar label='SU' />,
            () => <Badge value={3} />,
            () => <Tag value='Ready' />,
            () => <Skeleton />,
        ];

        for (const leaf of leaves) {
            for (const part of renderParts(leaf())) expectOnlyStates(part, []);
        }
    });
});

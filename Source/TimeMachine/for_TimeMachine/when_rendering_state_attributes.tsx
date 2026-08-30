// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TimeMachine } from '../TimeMachine';
import type { Version } from '../types';

const versions: Version[] = [
    {
        id: 'version-1',
        timestamp: new Date('2024-01-02T13:45:00Z'),
        label: 'Version 1',
        content: <div>First state</div>,
        events: [
            {
                sequenceNumber: 1,
                type: 'SampleCreated',
                occurred: new Date('2024-01-02T13:45:00Z'),
                content: { name: 'Sample' },
            },
        ],
    },
    {
        id: 'version-2',
        timestamp: new Date('2024-01-03T13:45:00Z'),
        label: 'Version 2',
        content: <div>Second state</div>,
        events: [
            {
                sequenceNumber: 2,
                type: 'SampleRenamed',
                occurred: new Date('2024-01-03T13:45:00Z'),
                content: { name: 'Updated sample' },
            },
        ],
    },
];

describe('when rendering TimeMachine state attributes', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider value={{ locale: 'en-US' }}>
                    <TimeMachine versions={versions} />
                </CratisComponentsProvider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should expose selected and pressed state only on the active view', () => {
        const views = container.querySelectorAll<HTMLButtonElement>('.view-button');

        expect(views[0].getAttribute('data-selected')).to.equal('true');
        expect(views[0].getAttribute('data-pressed')).to.equal('true');
        expect(views[1].hasAttribute('data-selected')).to.equal(false);
        expect(views[1].hasAttribute('data-pressed')).to.equal(false);
    });

    it('should expose selected and pressed state only on the selected timeline entry', () => {
        const entries = container.querySelectorAll<HTMLButtonElement>('.timeline-entry');

        expect(entries[0].getAttribute('data-selected')).to.equal('true');
        expect(entries[0].getAttribute('data-pressed')).to.equal('true');
        expect(entries[1].hasAttribute('data-selected')).to.equal(false);
        expect(entries[1].hasAttribute('data-pressed')).to.equal(false);
    });

    it('should expose disabled state only on unavailable navigation', () => {
        const previous = container.querySelector<HTMLButtonElement>('.nav-button.prev')!;
        const next = container.querySelector<HTMLButtonElement>('.nav-button.next')!;

        expect(previous.getAttribute('data-disabled')).to.equal('true');
        expect(next.hasAttribute('data-disabled')).to.equal(false);
    });

    it('should expose pressed state while a version card is flipped', async () => {
        const flip = container.querySelector<HTMLButtonElement>(
            '.version-window[data-selected] .window-flip-button',
        )!;
        expect(flip.hasAttribute('data-pressed')).to.equal(false);

        await act(async () => flip.click());

        expect(flip.getAttribute('data-pressed')).to.equal('true');
    });

    it('should expose selected state on events and markers for the selected version', async () => {
        const eventsView = container.querySelectorAll<HTMLButtonElement>('.view-button')[1];
        await act(async () => eventsView.click());

        const events = document.querySelectorAll<HTMLElement>(
            '[data-cratis-part="event"]',
        );
        const markers = document.querySelectorAll<HTMLElement>(
            '[data-cratis-part="marker"]',
        );
        expect(events[0].getAttribute('data-selected')).to.equal('true');
        expect(markers[0].getAttribute('data-selected')).to.equal('true');
        expect(events[1].hasAttribute('data-selected')).to.equal(false);
        expect(markers[1].hasAttribute('data-selected')).to.equal(false);
    });

    it('should omit busy state because the TimeMachine has no asynchronous work', () => {
        expect(container.querySelector('[data-busy]')).to.equal(null);
    });

    it('should never serialize false state attributes', () => {
        expect(container.querySelector('[data-selected="false"]')).to.equal(null);
        expect(container.querySelector('[data-pressed="false"]')).to.equal(null);
        expect(container.querySelector('[data-disabled="false"]')).to.equal(null);
        expect(container.querySelector('[data-busy="false"]')).to.equal(null);
    });
});

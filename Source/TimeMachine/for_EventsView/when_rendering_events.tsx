// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { EventsView, SelectedEventSequenceNumbersContext, type EventsViewProps } from '../EventsView';
import { defaultTimeMachineLabels } from '../TimeMachineLabels';
import type { Event } from '../types';

const eventAt = (sequenceNumber: number, type: string): Event => ({
    sequenceNumber,
    type,
    occurred: new Date(Date.UTC(2024, 0, sequenceNumber + 1)),
    content: { Name: type },
});

describe('when rendering events', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    const render = async (
        props: Partial<EventsViewProps>,
        selected?: ReadonlySet<number>,
    ) => {
        await act(async () => {
            root.render(
                <SelectedEventSequenceNumbersContext.Provider value={selected}>
                    <EventsView events={[]} {...props} />
                </SelectedEventSequenceNumbersContext.Provider>,
            );
        });
    };

    const events = [eventAt(1, 'First'), eventAt(2, 'Second'), eventAt(3, 'Third')];
    const all = (part: string) =>
        Array.from(container.querySelectorAll<HTMLElement>(`[data-cratis-part="${part}"]`));

    it('should alternate event positions starting on the right', async () => {
        await render({ events });
        all('event').map((element) => element.dataset.position)
            .should.deep.equal(['right', 'left', 'right']);
    });

    it('should render type and timestamp for each event', async () => {
        await render({ events });
        const names = Array.from(container.querySelectorAll('.events-view-event-name'));
        names.map((name) => name.textContent).should.deep.equal(['First', 'Second', 'Third']);
        const stamp = container.querySelector('.events-view-event-timestamp');
        expect(stamp?.textContent).to.equal(events[0].occurred.toLocaleString());
    });

    it('should mirror the position as modifier classes on the card, header, name and timestamp', async () => {
        await render({ events });
        const second = all('content')[1];
        expect(second.querySelector('.events-view-event-card--left')).not.to.equal(null);
        expect(second.querySelector('.events-view-event-header--right')).not.to.equal(null);
        expect(second.querySelector('.events-view-event-name--right')).not.to.equal(null);
        expect(second.querySelector('.events-view-event-timestamp--right')).not.to.equal(null);
        const first = all('content')[0];
        expect(first.querySelector('.events-view-event-card--right')).not.to.equal(null);
        expect(first.querySelector('.events-view-event-header--right')).to.equal(null);
        expect(first.querySelector('.events-view-event-header')?.className).to.equal('events-view-event-header ');
    });

    it('should draw a connector between events but not after the last one', async () => {
        await render({ events });
        all('connector').length.should.equal(2);
        expect(all('separator')[2].querySelector('[data-cratis-part="connector"]')).to.equal(null);
    });

    it('should mark selected events and markers from the context', async () => {
        await render({ events }, new Set([2]));
        all('event').map((element) => element.hasAttribute('data-selected'))
            .should.deep.equal([false, true, false]);
        all('marker').map((element) => element.hasAttribute('data-selected'))
            .should.deep.equal([false, true, false]);
    });

    it('should mark nothing selected without a context', async () => {
        await render({ events });
        all('event').some((element) => element.hasAttribute('data-selected')).should.equal(false);
    });

    it('should merge class names and part attributes', async () => {
        await render({
            events: [eventAt(1, 'Only')],
            className: 'extra',
            pt: {
                timeline: { className: 'tl' },
                event: { className: 'ev', id: 'ev-id' },
                separator: { className: 'sep' },
                marker: { className: 'mk' },
                content: { className: 'ct' },
            },
        });
        expect(all('timeline')[0].className).to.equal('events-view-timeline tl extra');
        expect(all('event')[0].className).to.equal('events-view-timeline-event ev');
        expect(all('event')[0].id).to.equal('ev-id');
        expect(all('separator')[0].className).to.equal('events-view-timeline-separator sep');
        expect(all('marker')[0].className).to.equal('events-view-marker mk');
        expect(all('content')[0].className).to.equal('events-view-timeline-content ct');
    });

    it('should expose the default and the overridden region label', async () => {
        await render({ events });
        const group = container.querySelector('[role="group"]')!;
        expect(group.getAttribute('aria-label')).to.equal('Event timeline');
        await render({ events, labels: { ...defaultTimeMachineLabels, eventTimelineRegion: 'Custom' } });
        expect(container.querySelector('[role="group"]')!.getAttribute('aria-label')).to.equal('Custom');
    });

    describe('scrolling', () => {
        let scrollTo: ReturnType<typeof vi.fn>;

        const stubScrollMetrics = (scrollTop: number, clientHeight: number, scrollHeight: number) => {
            const target = container.querySelector<HTMLElement>('.events-view-container')!;
            Object.defineProperty(target, 'scrollTop', { value: scrollTop, configurable: true });
            Object.defineProperty(target, 'clientHeight', { value: clientHeight, configurable: true });
            Object.defineProperty(target, 'scrollHeight', { value: scrollHeight, configurable: true });
            return target;
        };

        beforeEach(() => {
            scrollTo = vi.fn();
            HTMLElement.prototype.scrollTo = scrollTo as never;
            vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
        });

        it('should show no scroll buttons when everything fits', async () => {
            await render({ events });
            expect(container.querySelector('.events-view-scroll-button')).to.equal(null);
        });

        it('should show the down button when content extends below and scroll smoothly or instantly', async () => {
            await render({ events });
            const target = stubScrollMetrics(0, 100, 500);
            await act(async () => {
                target.dispatchEvent(new Event('scroll'));
            });
            expect(container.querySelector('.events-view-scroll-button--top')).to.equal(null);
            const down = container.querySelector<HTMLButtonElement>('.events-view-scroll-button--bottom')!;
            expect(down.getAttribute('aria-label')).to.equal('Scroll to bottom');
            await act(async () => {
                down.click();
            });
            expect(scrollTo.mock.calls[0][0]).to.deep.equal({ top: 500, behavior: 'auto' });
        });

        it('should show the up button when scrolled and scroll back to the top', async () => {
            await render({ events });
            const target = stubScrollMetrics(200, 100, 300);
            await act(async () => {
                target.dispatchEvent(new Event('scroll'));
            });
            expect(container.querySelector('.events-view-scroll-button--bottom')).to.equal(null);
            const up = container.querySelector<HTMLButtonElement>('.events-view-scroll-button--top')!;
            await act(async () => {
                up.click();
            });
            expect(scrollTo.mock.calls[0][0]).to.deep.equal({ top: 0, behavior: 'auto' });
        });
    });
});

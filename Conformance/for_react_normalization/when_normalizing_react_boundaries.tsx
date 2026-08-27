// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { StrictMode, act, createElement, createRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it } from 'vitest';
import {
    composeHandlers,
    listen,
    mergeRefs,
    normalizeReactProps,
    normalizeStyle,
} from '../src/internal/reactNormalization.js';

describe('when normalizing React boundaries', () => {
    it('should normalize class label style CSS variables and SVG casing', () => {
        const props = normalizeReactProps({
            class: 'sample',
            for: 'field',
            'stroke-width': 2,
            'fill-rule': 'evenodd',
        });
        const style = normalizeStyle({ color: 'red', '--sample-color': 'blue' });

        props.should.deep.equal({
            className: 'sample',
            htmlFor: 'field',
            strokeWidth: 2,
            fillRule: 'evenodd',
        });
        style.should.deep.equal({ color: 'red', '--sample-color': 'blue' });
    });

    it('should merge refs and preserve handler order and preventDefault', () => {
        const objectRef = createRef<HTMLElement>();
        let callbackValue: HTMLElement | null = null;
        const target = document.createElement('button');
        const merged = mergeRefs(objectRef, (value) => { callbackValue = value; });
        if (typeof merged === 'function') merged(target);
        const order: string[] = [];
        composeHandlers<Event>(
            (event) => { order.push('pt'); event.preventDefault(); },
            () => order.push('public'),
        )(new Event('click', { cancelable: true }));

        (objectRef.current === target).should.equal(true);
        (callbackValue === target).should.equal(true);
        order.should.deep.equal(['pt']);
    });

    it('should clean listeners exactly once across StrictMode replay', async () => {
        let calls = 0;
        const Listener = () => {
            useEffect(() => listen(document, 'click', () => { calls += 1; }), []);
            return null;
        };
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);
        await act(async () => {
            root.render(createElement(StrictMode, null, createElement(Listener)));
        });
        document.dispatchEvent(new Event('click'));
        calls.should.equal(1);
        await act(async () => root.unmount());
        document.dispatchEvent(new Event('click'));
        calls.should.equal(1);
        container.remove();
    });
});

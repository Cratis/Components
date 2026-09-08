// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { observeColorEnvironment } from '../components/pivot/colorResolver';

const waitForMutationDelivery = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('when the PivotViewer theme environment changes', () => {
    it('should_observe_class_changes_on_an_ancestor', async () => {
        const host = document.createElement('div');
        const viewer = document.createElement('div');
        host.append(viewer);
        document.body.append(host);
        let changes = 0;
        const stop = observeColorEnvironment(viewer, () => changes++);

        host.classList.add('cratis-dark');
        await waitForMutationDelivery();

        expect(changes).to.equal(1);
        stop();
        host.remove();
    });

    it('should_stop_observing_after_cleanup', async () => {
        const viewer = document.createElement('div');
        document.body.append(viewer);
        let changes = 0;
        const stop = observeColorEnvironment(viewer, () => changes++);

        stop();
        document.documentElement.classList.add('cratis-dark');
        await waitForMutationDelivery();

        expect(changes).to.equal(0);
        document.documentElement.classList.remove('cratis-dark');
        viewer.remove();
    });
});

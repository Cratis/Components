// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { retryUntil, switchRenderer } from './renderer-switch.mjs';

test('should stop after the first successful attempt', async (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 0 });
    const attempts = [];
    await retryUntil(30_000, async (timeout, attempt) => {
        attempts.push({ timeout, attempt });
        return true;
    }, 4_000);
    assert.deepEqual(attempts, [{ timeout: 4_000, attempt: 1 }]);
});

test('should reattempt until a later selection succeeds', async (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 0 });
    const attempts = [];
    await retryUntil(30_000, async (timeout, attempt) => {
        attempts.push(attempt);
        context.mock.timers.tick(timeout);
        return attempt === 3;
    }, 4_000);
    assert.deepEqual(attempts, [1, 2, 3]);
});

test('should bound the final attempt and throw after the deadline', async (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 0 });
    const timeouts = [];
    await assert.rejects(retryUntil(10_000, async (timeout) => {
        timeouts.push(timeout);
        context.mock.timers.tick(timeout);
        return false;
    }, 4_000), /Retry deadline exceeded/);
    assert.deepEqual(timeouts, [4_000, 4_000, 2_000]);
    assert.equal(Date.now(), 10_000);
});

test('should not start a selection after the deadline', async (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 30_000 });
    await assert.rejects(retryUntil(30_000, async () => {
        assert.fail('An expired deadline must not start an attempt.');
    }, 4_000), /Retry deadline exceeded/);
});

test('should preserve unexpected selection errors', async () => {
    const error = new Error('Page closed');
    await assert.rejects(retryUntil(Date.now() + 30_000, async () => {
        throw error;
    }, 4_000), error);
});

test('should include source, target and last URL if readiness exhausts the deadline', async (context) => {
    context.mock.timers.enable({ apis: ['Date'], now: 0 });
    const page = {
        locator: () => ({
            waitFor: async ({ timeout }) => {
                context.mock.timers.tick(timeout);
                throw new Error('Renderer is not visible');
            },
        }),
        url: () => 'http://localhost/?path=/story/source_link',
    };
    await assert.rejects(switchRenderer(page, {
        selectorQuery: 'select', sourceRendererId: 'source', targetRendererId: 'target', storyId: 'link',
    }), {
        message: "Renderer switch from 'source' to 'target' exceeded 30000ms; last URL: http://localhost/?path=/story/source_link",
    });
});

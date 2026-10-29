// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Each attempt owns its wait, bounded by the supplied timeout; false requests a retry.
export const retryUntil = async (deadline, attemptFn, intervalMs) => {
    for (let attempt = 1; ; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error('Retry deadline exceeded.');
        if (await attemptFn(Math.min(intervalMs, remaining), attempt)) return;
    }
};

const waitForRenderer = async (page, selectorQuery, targetRendererId, remaining) => {
    await page.locator(selectorQuery).waitFor({ state: 'visible', timeout: remaining() });
    await page.waitForFunction(({ selectorQuery, targetRendererId }) => {
        const select = document.querySelector(selectorQuery);
        return select?.matches(':enabled') && Array.from(select.options)
            .some(option => option.value === targetRendererId && !option.disabled);
    }, { selectorQuery, targetRendererId }, { timeout: remaining() });
};

const selectRenderer = async (page, { selectorQuery, targetRendererId, storyId }, timeout, remaining) => {
    await page.locator(selectorQuery).selectOption(targetRendererId, { timeout: remaining() });
    try {
        await page.waitForURL(url => url.searchParams.get('path') === `/story/${targetRendererId}_${storyId}`, {
            timeout: Math.min(timeout, remaining()),
        });
        return true;
    } catch (error) {
        if (error.name !== 'TimeoutError') throw error;
        return false;
    }
};

export const switchRenderer = async (page, { selectorQuery, sourceRendererId, targetRendererId, storyId }) => {
    const deadline = Date.now() + 30_000;
    const remaining = () => Math.max(1, deadline - Date.now());
    try {
        await waitForRenderer(page, selectorQuery, targetRendererId, remaining);
        await retryUntil(deadline, (timeout, attempt) => {
            if (attempt > 1) console.log(`Re-selecting renderer '${targetRendererId}' (attempt ${attempt})`);
            return selectRenderer(page, { selectorQuery, targetRendererId, storyId }, timeout, remaining);
        }, 4_000);
    } catch (error) {
        if (Date.now() < deadline) throw error;
        throw new Error(`Renderer switch from '${sourceRendererId}' to '${targetRendererId}' exceeded 30000ms; last URL: ${page.url()}`, { cause: error });
    }
};

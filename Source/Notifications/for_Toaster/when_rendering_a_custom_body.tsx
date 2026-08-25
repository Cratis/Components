// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type { ToastType } from '../toast';
import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { toast } from '../toast';
import { type ToasterInTheDom, renderToaster, unmountToaster } from './given/a_toaster';

describe('when rendering a custom toast body', () => {
    let toaster: ToasterInTheDom;
    let customBody: React.ReactElement;
    let toastId: string | number;
    let dismissedToast: ToastType | undefined;

    beforeEach(async () => {
        toaster = await renderToaster({ dismissAriaLabel: 'Dismiss notification' });
        customBody = <div data-custom-toast-body>Custom failure details</div>;

        await act(async () => {
            toastId = toast.error({
                render: customBody,
                onDismiss: (item) => {
                    dismissedToast = item;
                },
            });
        });
    });

    afterEach(async () => {
        await unmountToaster(toaster);
    });

    it('should render the custom body inside the normal content frame', () => {
        const content = document.querySelector('[data-cratis-part="content"]');
        expect(content?.querySelector('[data-custom-toast-body]')).not.to.equal(null);
    });

    it('should retain the severity icon', () => {
        const icon = document.querySelector('[data-cratis-part="icon"]');
        expect(icon?.textContent).to.equal('⨯');
    });

    it('should retain an accessible dismiss control', () => {
        const close = document.querySelector<HTMLButtonElement>(
            '[data-cratis-part="close"]',
        );
        expect(close?.getAttribute('aria-label')).to.equal('Dismiss notification');
    });

    it('should dismiss without a consumer-owned id or close button', async () => {
        const close = document.querySelector<HTMLButtonElement>(
            '[data-cratis-part="close"]',
        );
        if (!close) {
            throw new Error('Custom toast did not retain its close control.');
        }
        await act(async () => close.click());

        expect(dismissedToast?.id).to.equal(toastId);
        expect(dismissedToast?.render).to.equal(customBody);
    });
});

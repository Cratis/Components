// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { toast } from '../toast';
import { type ToasterInTheDom, renderToaster, unmountToaster } from './given/a_toaster';

describe('when rendering toasts', () => {
    let toaster: ToasterInTheDom;

    beforeEach(async () => {
        toaster = await renderToaster();
    });

    afterEach(async () => {
        await unmountToaster(toaster);
    });

    const part = (name: string) => document.querySelector(`[data-cratis-part="${name}"]`);

    it('should render title and description', async () => {
        await act(async () => {
            toast.info({ title: 'Saved', description: 'All good' });
        });
        expect(part('title')?.textContent).to.equal('Saved');
        expect(part('description')?.textContent).to.equal('All good');
    });

    it('should omit title and description when not given', async () => {
        await act(async () => {
            toast.info({ title: 'Only title' });
        });
        expect(part('description')).to.equal(null);
    });

    it('should render an action button merging classes', async () => {
        await act(async () => {
            toast.info({ title: 'x', action: { children: 'Undo', className: 'mine' } });
        });
        const action = part('action') as HTMLButtonElement;
        expect(action.type).to.equal('button');
        expect(action.textContent).to.equal('Undo');
        expect(action.className).to.equal('cratis-toast__action mine');
    });

    it('should announce errors as alerts and others as status', async () => {
        await act(async () => {
            toast.error({ title: 'bad' });
        });
        expect(part('toast')?.getAttribute('role')).to.equal('alert');
        expect(part('toast')?.getAttribute('data-severity')).to.equal('error');
        await act(async () => {
            toast.dismiss();
            toast.success({ title: 'good' });
        });
        expect(part('toast')?.getAttribute('role')).to.equal('status');
    });

    it('should show the severity symbol, the loading symbol or a custom icon', async () => {
        await act(async () => {
            toast.success({ title: 'a' });
        });
        expect(part('icon')?.textContent).to.equal('✓');
        await act(async () => {
            toast.dismiss();
            toast.success({ title: 'b', loading: true });
        });
        expect(part('icon')?.textContent).to.equal('◌');
        await act(async () => {
            toast.dismiss();
            toast.success({ title: 'c', icon: 'ICON' });
        });
        expect(part('icon')?.textContent).to.equal('ICON');
    });

    it('should hide the dismiss button when the toast is not dismissible', async () => {
        await act(async () => {
            toast.info({ title: 'sticky', dismissible: false });
        });
        expect(part('close')).to.equal(null);
    });

    it('should dismiss when the close button is clicked', async () => {
        await act(async () => {
            toast.info({ title: 'bye' });
        });
        await act(async () => {
            (part('close') as HTMLButtonElement).click();
        });
        expect(part('toast')).to.equal(null);
    });
});

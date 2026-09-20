// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Breadcrumbs } from '../Breadcrumbs';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when marking the current page', () => {
    let mounted: MountedPrimitive;

    beforeEach(async () => {
        mounted = await mountPrimitive(
            <Breadcrumbs
                aria-label='Breadcrumb'
                items={[
                    { label: 'Requests', href: '/requests' },
                    { label: 'Equinor ASA', href: '/requests/equinor' },
                    { label: 'FRP-1284' },
                ]}
            />,
        );
    });

    afterEach(async () => {
        await unmountPrimitive(mounted);
    });

    it('should be a named navigation landmark', () => {
        const root = mounted.container.querySelector('[data-cratis-part="root"]');
        expect(root?.closest('nav')?.getAttribute('aria-label')).to.equal('Breadcrumb');
    });

    it('should mark only the last segment as the current page', () => {
        const links = Array.from(
            mounted.container.querySelectorAll('[data-cratis-part="link"]'),
        );
        expect(links.map((link) => link.getAttribute('aria-current'))).to.deep.equal([
            null,
            null,
            'page',
        ]);
    });

    it('should give the current page no destination and take it out of the tab order', () => {
        const links = Array.from(
            mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="link"]'),
        );
        expect(links.map((link) => link.getAttribute('href'))).to.deep.equal([
            '/requests',
            '/requests/equinor',
            null,
        ]);
        expect(links[2].getAttribute('data-disabled')).to.equal('true');
    });

    it('should hide the separators from assistive technology', () => {
        const separators = Array.from(
            mounted.container.querySelectorAll('[data-cratis-part="separator"]'),
        );
        expect(separators).to.have.lengthOf(2);
        expect(separators.every((s) => s.getAttribute('aria-hidden') === 'true')).to.equal(
            true,
        );
    });
});

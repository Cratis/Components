// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { useFieldAccessibility } from '../fields/fieldAccessibility';

const ValidationProbe = () => {
    const accessibility = useFieldAccessibility({
        title: 'Email',
        errors: ['Email is required', 'Email is invalid'],
    });
    return (
        <>
            <input
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
            />
            {accessibility.hiddenError}
        </>
    );
};

describe('when rendering validation errors', () => {
    const html = renderToStaticMarkup(<ValidationProbe />);
    const descriptionId = html.match(/aria-describedby="([^"]+)"/)?.[1];

    it('should associate the primary control with an error description', () => {
        expect(descriptionId).not.to.equal(undefined);
        expect(html).to.contain(`id="${descriptionId}"`);
    });

    it('should expose every validation message to assistive technology', () => {
        expect(html).to.contain('Email is required. Email is invalid');
    });
});

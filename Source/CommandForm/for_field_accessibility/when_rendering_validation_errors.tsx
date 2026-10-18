// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { useFieldAccessibility } from '../fields/fieldAccessibility';

const ValidationProbe = ({ id }: { id?: string }) => {
    const accessibility = useFieldAccessibility({
        id,
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

describe('when Arc supplies the field id with validation errors', () => {
    const html = renderToStaticMarkup(<ValidationProbe id='example-arc-field' />);

    it('should retain the supplied control id', () => {
        html.should.contain('<input id="example-arc-field"');
    });

    it('should associate the supplied id with every validation message', () => {
        html.should.contain('aria-describedby="example-arc-field-errors"');
        html.should.contain('id="example-arc-field-errors"');
        html.should.contain('Email is required. Email is invalid');
    });
});

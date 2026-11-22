// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { Button } from '../Button';

describe('when rendering a Button icon, label and parts', () => {
    it('should render a string icon as a hidden icon element before the label', () => {
        const html = renderToStaticMarkup(<Button label='Save' icon='sample-icon' />);

        expect(html).to.equal(
            '<button data-cratis-component="Button" data-cratis-component-instance="_R_0_" type="button" class="cratis-button" data-cratis-part="root" data-variant="solid" data-shape="default" data-size="normal">' +
            '<span class="cratis-button__icon" data-cratis-part="icon" aria-hidden="true"><i class="sample-icon" aria-hidden="true"></i></span>' +
            '<span class="cratis-button__label" data-cratis-part="label">Save</span></button>',
        );
    });

    it('should render an element icon as given and mark an icon-only button', () => {
        const html = renderToStaticMarkup(<Button icon={<b>glyph</b>} aria-label='Glyph' />);

        expect(html).to.equal(
            '<button data-cratis-component="Button" data-cratis-component-instance="_R_0_" type="button" class="cratis-button" aria-label="Glyph" data-cratis-part="root" data-variant="solid" data-shape="default" data-size="normal" data-icon-only="true">' +
            '<span class="cratis-button__icon" data-cratis-part="icon" aria-hidden="true"><b>glyph</b></span></button>',
        );
    });

    it('should replace the icon with the spinner while loading', () => {
        const html = renderToStaticMarkup(<Button label='Save' icon='sample-icon' loading />);

        expect(html).to.contain('data-cratis-part="spinner"');
        expect(html).not.to.contain('data-cratis-part="icon"');
    });

    it('should render the label before the children in one label part', () => {
        const html = renderToStaticMarkup(<Button label='First'><em>second</em></Button>);

        expect(html).to.contain('<span class="cratis-button__label" data-cratis-part="label">First<em>second</em></span>');
        expect(html).not.to.contain('data-icon-only');
    });

    it('should merge part and caller classes, styles and attributes', () => {
        const html = renderToStaticMarkup(
            <Button
                label='Save'
                icon='sample-icon'
                loading={false}
                className='sample-caller'
                style={{ color: 'red' }}
                data-sample='native'
                pt={{
                    root: { className: 'sample-root', style: { margin: 1, color: 'blue' } },
                    icon: { className: 'sample-icon-part', 'aria-hidden': false },
                    label: { className: 'sample-label', id: 'sample-label-id' },
                }}
            />,
        );

        expect(html).to.equal(
            '<button class="cratis-button sample-root sample-caller" style="margin:1px;color:red" data-sample="native" data-cratis-component="Button" data-cratis-component-instance="_R_0_" type="button" data-cratis-part="root" data-variant="solid" data-shape="default" data-size="normal">' +
            '<span class="cratis-button__icon sample-icon-part" aria-hidden="false" data-cratis-part="icon"><i class="sample-icon" aria-hidden="true"></i></span>' +
            '<span class="cratis-button__label sample-label" id="sample-label-id" data-cratis-part="label">Save</span></button>',
        );
    });

    it('should merge the spinner part classes', () => {
        const html = renderToStaticMarkup(<Button label='Save' loading pt={{ spinner: { className: 'sample-spinner' } }} />);

        expect(html).to.contain('<span class="cratis-button__spinner sample-spinner" data-cratis-part="spinner" aria-hidden="true"></span>');
    });

    it('should wrap the button in a tooltip only when a tooltip is given', () => {
        const plain = renderToStaticMarkup(<Button label='Save' />);
        const wrapped = renderToStaticMarkup(
            <Button label='Save' tooltip='Sample tip' tooltipOptions={{ position: 'bottom', className: 'sample-tip' }} />,
        );

        expect(plain).not.to.contain('cratis-tooltip-trigger');
        expect(wrapped).to.contain('class="cratis-tooltip-trigger cratis-button sample-tip"');
        expect(wrapped).to.contain('data-cratis-tooltip-trigger=""');
    });

    it('should render no label part without a label or children', () => {
        const html = renderToStaticMarkup(<Button icon='sample-icon' />);

        expect(html).not.to.contain('data-cratis-part="label"');
    });
});

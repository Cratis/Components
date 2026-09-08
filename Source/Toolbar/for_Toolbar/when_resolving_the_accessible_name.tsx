// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Toolbar } from '../Toolbar';

const renderToolbar = (toolbar: React.ReactElement) =>
    renderToStaticMarkup(
        <CratisComponentsProvider
            value={{ messages: { toolbar: { label: 'Provider tools' } } }}
        >
            {toolbar}
        </CratisComponentsProvider>,
    );

describe('when resolving the Toolbar accessible name', () => {
    it('should_use_the_provider_message_when_no_named_prop_is_supplied', () => {
        const html = renderToolbar(<Toolbar>Tool</Toolbar>);

        expect(html).to.contain('aria-label="Provider tools"');
    });

    it('should_prefer_the_named_component_prop_over_the_provider_message', () => {
        const html = renderToolbar(<Toolbar aria-label='Canvas tools'>Tool</Toolbar>);

        expect(html).to.contain('aria-label="Canvas tools"');
        expect(html).not.to.contain('aria-label="Provider tools"');
    });

    it('should_prefer_aria_labelledby_over_every_fallback_label', () => {
        const html = renderToolbar(
            <Toolbar aria-label='Canvas tools' aria-labelledby='toolbar-heading'>
                Tool
            </Toolbar>,
        );

        expect(html).to.contain('aria-labelledby="toolbar-heading"');
        expect(html).not.to.contain('aria-label=');
    });
});

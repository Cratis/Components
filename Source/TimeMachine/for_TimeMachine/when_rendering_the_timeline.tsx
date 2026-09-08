// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { TimeMachine } from '../TimeMachine';

const html = renderToStaticMarkup(
    <CratisComponentsProvider value={{ locale: 'nb-NO' }}>
        <TimeMachine
            versions={[
                {
                    id: 'version-1',
                    timestamp: new Date('2024-01-02T13:45:00Z'),
                    label: 'Version 1',
                    content: <div>State</div>,
                    events: [],
                },
            ]}
        />
    </CratisComponentsProvider>,
);

describe('when rendering the TimeMachine timeline', () => {
    it('should_render_versions_as_native_buttons', () => {
        expect(html).to.match(/<button[^>]+class="timeline-entry selected[^>]*>/);
    });

    it('should_expose_the_selected_version_state', () => {
        expect(html).to.contain('aria-pressed="true"');
    });

    it('should_format_the_timeline_with_the_provider_locale', () => {
        expect(html).to.match(/aria-label="[^"]*(jan\.|januar)[^"]*"/i);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarContext } from '../ToolbarContext';
import { ToolbarFanOutItem } from '../ToolbarFanOutItem';
import { ToolbarFolder } from '../ToolbarFolder';
import { ToolbarSection } from '../ToolbarSection';

const icon = <span aria-hidden='true'>•</span>;

const findButton = (html: string, label: string) => {
    const labelIndex = html.indexOf(`aria-label="${label}"`);
    const startIndex = html.lastIndexOf('<button', labelIndex);
    const endIndex = html.indexOf('>', labelIndex);
    expect(labelIndex, `Expected a button labelled ${label}`).to.be.greaterThan(-1);
    return html.slice(startIndex, endIndex + 1);
};

describe('when rendering hidden toolbar items', () => {
    const html = renderToStaticMarkup(
        <CratisComponentsProvider>
            <ToolbarSection activeContext='visible'>
                <ToolbarContext name='visible'>
                    <ToolbarButton icon={icon} title='Visible context tool' />
                </ToolbarContext>
                <ToolbarContext name='hidden'>
                    <ToolbarButton icon={icon} title='Hidden context tool' />
                </ToolbarContext>
            </ToolbarSection>
            <ToolbarFolder icon={icon} title='Folder'>
                <ToolbarButton icon={icon} title='Hidden folder tool' />
            </ToolbarFolder>
            <ToolbarFanOutItem icon={icon} tooltip='Fan out'>
                <ToolbarButton icon={icon} title='Hidden fan-out tool' />
            </ToolbarFanOutItem>
        </CratisComponentsProvider>,
    );

    it('should keep tooltip focus behavior on visible items', () => {
        expect(findButton(html, 'Visible context tool')).to.include('tabindex="0"');
    });

    it('should not install tooltip focus behavior in an inactive context', () => {
        expect(findButton(html, 'Hidden context tool')).not.to.include('tabindex');
    });

    it('should not install tooltip focus behavior in a collapsed folder', () => {
        expect(findButton(html, 'Hidden folder tool')).not.to.include('tabindex');
    });

    it('should not install tooltip focus behavior in a collapsed fan-out', () => {
        expect(findButton(html, 'Hidden fan-out tool')).not.to.include('tabindex');
    });
});

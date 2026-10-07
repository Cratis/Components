// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import { PropertyConceptsProvider } from '../PropertyConceptsContext';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import type { JsonSchema } from '../../../types/JsonSchema';
import { Mount } from './Mount';

const schema: JsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
const properties = (): Property[] => [{ id: 'one', name: 'first', type: PropertyType.String }];

describe('when concepts are enabled but none are defined', () => {
    const mount = new Mount();
    let offered: string[];
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} concepts={[]} />);
        await mount.openMenu(mount.parts('add')[0]);
        offered = await mount.openSubmenu('Concepts');
    });
    afterEach(() => mount.teardown());

    it('should show a disabled hint', () => {
        const hint = mount.menuItems().find(item => item.textContent === 'No concepts defined')!;
        expect(hint).to.not.equal(undefined);
        expect(hint.hasAttribute('data-disabled') || hint.getAttribute('aria-disabled') === 'true').to.equal(true);
    });

    it('should keep the Concepts entry', () => {
        expect(document.body.textContent).to.contain('Concepts');
        expect(offered).to.include('No concepts defined');
    });
});

describe('when concepts come from an empty provider', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<PropertyConceptsProvider concepts={[]}><SchemaEditor layout='tree' schema={schema} labels={{ noConcepts: 'Nothing here' }} /></PropertyConceptsProvider>);
        await mount.openMenu(mount.parts('add')[0]);
        await mount.openSubmenu('Concepts');
    });
    afterEach(() => mount.teardown());

    it('should show the hint with the supplied label', () => {
        expect(mount.menuItems().some(item => item.textContent === 'Nothing here')).to.equal(true);
    });
});

describe('when concepts are not enabled at all', () => {
    const mount = new Mount();
    let offered: string[];
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} />);
        offered = await mount.openMenu(mount.parts('add')[0]);
    });
    afterEach(() => mount.teardown());

    it('should not show the concepts group or the hint', () => {
        expect(offered).to.not.include('No concepts defined');
        expect(document.body.textContent).to.not.contain('Concepts');
    });
});

describe('when a host styles and replaces the type badge', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(
            <SchemaEditor
                layout='tree'
                schema={{ type: 'object', properties: { name: { type: 'string' }, count: { type: 'number' } } }}
                renderPropertyTypeBadge={(property, context, defaultBadge) => property.name === 'count'
                    ? <em data-testid='custom'>{`custom ${context.depth}`}</em>
                    : defaultBadge} />);
    });
    afterEach(() => mount.teardown());

    it('should mark the default badge with the property type', () => {
        expect(mount.control('name', 'badge').getAttribute('data-property-type')).to.equal('string');
    });

    it('should render the replacement where the host supplies one', () => {
        expect(mount.row('count').querySelector('[data-testid="custom"]')!.textContent).to.equal('custom 0');
        expect(mount.row('count').querySelector('[data-cratis-part="badge"]')).to.equal(null);
    });
});

describe('when a host locks the type with a reason', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(
            <SchemaEditor
                layout='tree'
                schema={schema}
                getPropertyRowState={() => ({ lockType: true, lockTypeReason: 'Mapped to an input' })} />);
    });
    afterEach(() => mount.teardown());

    it('should offer no type menu', () => {
        expect(mount.parts('typeButton')).to.have.length(0);
    });

    it('should show the reason as the badge tooltip', () => {
        expect(mount.control('name', 'badge').getAttribute('title')).to.equal('Mapped to an input');
    });

    it('should describe the badge with the reason', () => {
        const badge = mount.control('name', 'badge');
        const description = document.getElementById(badge.getAttribute('aria-describedby')!);
        expect(description!.textContent).to.equal('Mapped to an input');
    });
});

describe('when a host lock has no reason', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} getPropertyRowState={() => ({ lockType: true })} />);
    });
    afterEach(() => mount.teardown());

    it('should add neither a tooltip nor a description', () => {
        const badge = mount.control('name', 'badge');
        expect(badge.hasAttribute('title')).to.equal(false);
        expect(badge.hasAttribute('aria-describedby')).to.equal(false);
    });
});

describe('when clicking inside a row', () => {
    const mount = new Mount();
    let clicked: string[];
    beforeEach(async () => {
        mount.setup();
        clicked = [];
        await mount.render(
            <SchemaEditor
                layout='tree'
                schema={schema}
                onPropertyClick={propertyId => clicked.push(propertyId)}
                renderPropertyAccessory={() => (
                    <>
                        <button type='button' data-testid='plain'>plain</button>
                        <button type='button' data-testid='opted' data-schema-row-select>
                            <span data-testid='inner'>opted</span>
                        </button>
                    </>
                )} />);
    });
    afterEach(() => mount.teardown());

    it('should ignore a click on an interactive element', async () => {
        await mount.click(document.querySelector<HTMLElement>('[data-testid="plain"]')!);
        expect(clicked).to.have.length(0);
    });

    it('should select the row from an element that opts in', async () => {
        await mount.click(document.querySelector<HTMLElement>('[data-testid="opted"]')!);
        expect(clicked).to.have.length(1);
    });

    it('should select the row from inside an element that opts in', async () => {
        await mount.click(document.querySelector<HTMLElement>('[data-testid="inner"]')!);
        expect(clicked).to.have.length(1);
    });
});

describe('when the host supplies toggle callbacks in controlled mode', () => {
    const mount = new Mount();
    afterEach(() => mount.teardown());

    it('should imply the required and key toggles', async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' properties={properties()} onSetRequiredProperty={() => undefined} onSetKeyProperty={() => undefined} />);
        expect(mount.parts('required')).to.have.length(1);
        expect(mount.parts('key')).to.have.length(1);
    });

    it('should honor an explicit false', async () => {
        mount.setup();
        await mount.render(
            <SchemaEditor
                layout='tree'
                properties={properties()}
                allowRequired={false}
                allowKeyProperty={false}
                onSetRequiredProperty={() => undefined}
                onSetKeyProperty={() => undefined} />);
        expect(mount.parts('required')).to.have.length(0);
        expect(mount.parts('key')).to.have.length(0);
    });

    it('should offer nothing without the callbacks', async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' properties={properties()} allowRequired allowKeyProperty />);
        expect(mount.parts('required')).to.have.length(0);
        expect(mount.parts('key')).to.have.length(0);
    });
});

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@cratis/arc/validation';
import { Command } from '@cratis/arc/commands';
import { CommandForm } from '@cratis/arc.react/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { InputTextField } from '../fields/InputTextField';

class RenamePerson extends Command {
    readonly route = '/rename-person';
    readonly propertyDescriptors = [new PropertyDescriptor('name', String)];
    name = '';

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['name'];
    }
}

describe('when rendering a titled field', () => {
    const field = (
        <CommandForm command={RenamePerson}>
            <InputTextField<RenamePerson>
                value={(command) => command.name}
                title='Person name'
            />
        </CommandForm>
    );
    const html = renderToStaticMarkup(field);
    const inputId = html.match(/<input[^>]+id="([^"]+)"/)?.[1];

    it('should name the primary control from the field title', () => {
        expect(html).to.contain('aria-label="Person name"');
    });

    it('should retain the stable id supplied by Arc rather than generating another', () => {
        // Arc's CommandFormFieldWrapper supplies useId() and associates its label with that id.
        (inputId ?? '').should.not.equal('');
        html.should.contain(`<label for="${inputId}"`);
        renderToStaticMarkup(field).should.equal(html);
    });

    it('should give separate fields distinct ids associated with their labels', () => {
        const multipleFields = renderToStaticMarkup(
            <CommandForm command={RenamePerson}>
                <InputTextField<RenamePerson> value={command => command.name} title='Person name' />
                <InputTextField<RenamePerson> value={command => command.name} title='Confirm name' />
            </CommandForm>,
        );
        const ids = [...multipleFields.matchAll(/<input[^>]+id="([^"]+)"/g)].map(match => match[1]);
        ids.should.have.lengthOf(2);
        new Set(ids).size.should.equal(2);
        ids.forEach(id => {
            id.should.not.equal('');
            multipleFields.should.contain(`<label for="${id}"`);
        });
    });
});

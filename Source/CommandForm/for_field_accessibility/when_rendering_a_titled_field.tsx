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
    const html = renderToStaticMarkup(
        <CommandForm command={RenamePerson}>
            <InputTextField<RenamePerson>
                value={(command) => command.name}
                title='Person name'
            />
        </CommandForm>,
    );

    it('should name the primary control from the field title', () => {
        expect(html).to.contain('aria-label="Person name"');
    });

    it('should give the primary control a stable generated id', () => {
        expect(html).to.match(/<input[^>]+id="cratis-field-[^"]+"/);
    });
});

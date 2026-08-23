// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@cratis/arc/validation';
import { Command } from '@cratis/arc/commands';
import { CommandForm } from '@cratis/arc.react/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it } from 'vitest';
import { RadioButtonField } from '../fields/RadioButtonField';
import { RadioGroupField } from '../fields/RadioGroupField';
import { RatingField } from '../fields/RatingField';

class ChooseOptions extends Command {
    readonly route = '/choose-options';
    readonly propertyDescriptors = [
        new PropertyDescriptor('choice', String),
        new PropertyDescriptor('rating', Number),
    ];
    choice = '';
    rating = 0;

    constructor() {
        super(Object, false);
    }

    get requestParameters(): string[] {
        return [];
    }

    get properties(): string[] {
        return ['choice', 'rating'];
    }
}

const radioNames = (html: string) =>
    Array.from(
        html.matchAll(/<input[^>]+type="radio"[^>]+name="([^"]+)"/g),
        (match) => match[1],
    );

describe('when rendering native radio groups', () => {
    it('should give generated group options one shared name', () => {
        const html = renderToStaticMarkup(
            <CommandForm command={ChooseOptions}>
                <RadioGroupField<ChooseOptions>
                    value={(command) => command.choice}
                    title='Choice'
                    options={[
                        { id: 'one', label: 'One' },
                        { id: 'two', label: 'Two' },
                    ]}
                    optionValue='id'
                    optionLabel='label'
                />
            </CommandForm>,
        );
        const names = radioNames(html);
        expect(names).to.have.lengthOf(2);
        expect(new Set(names).size).to.equal(1);
    });

    it('should give rating options one shared name', () => {
        const html = renderToStaticMarkup(
            <CommandForm command={ChooseOptions}>
                <RatingField<ChooseOptions>
                    value={(command) => command.rating}
                    title='Rating'
                    stars={3}
                />
            </CommandForm>,
        );
        const names = radioNames(html);
        expect(names).to.have.lengthOf(3);
        expect(new Set(names).size).to.equal(1);
    });

    it('should preserve an explicit name across separate radio fields', () => {
        const html = renderToStaticMarkup(
            <CommandForm command={ChooseOptions}>
                <RadioButtonField<ChooseOptions>
                    name='choice'
                    value={(command) => command.choice}
                    buttonValue='one'
                    label='One'
                />
                <RadioButtonField<ChooseOptions>
                    name='choice'
                    value={(command) => command.choice}
                    buttonValue='two'
                    label='Two'
                />
            </CommandForm>,
        );
        expect(radioNames(html)).to.deep.equal(['choice', 'choice']);
    });
});

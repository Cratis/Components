// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Command, CommandValidator } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';

export class SampleCommand extends Command {
    readonly route = '/api/example';
    readonly validation: CommandValidator<SampleCommand> = new (class extends CommandValidator<SampleCommand> {})();
    readonly propertyDescriptors = [
        new PropertyDescriptor('name', String),
        new PropertyDescriptor('count', Number),
        new PropertyDescriptor('enabled', Boolean),
        new PropertyDescriptor('startDate', Date),
    ];
    name = 'Example';
    count = 12;
    enabled = true;
    startDate = new Date('2026-01-02T12:00:00Z');

    get requestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, false);
    }
}

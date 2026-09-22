// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { Guid } from '@cratis/fundamentals';

// Independently authored, generated-shape fixture for Components; all values are synthetic.
export const sampleId = Guid.parse('c4cabc30-211b-447d-9ec2-5087e640a5ac');

export class SampleGuidCommand extends Command {
    readonly route = '/api/sample-command';
    readonly propertyDescriptors = [
        new PropertyDescriptor('sampleId', Guid),
        new PropertyDescriptor('name', String),
    ];
    sampleId!: Guid;
    name = 'Sample User';

    get requestParameters(): string[] {
        return [];
    }

    constructor() {
        super(Object, false);
    }
}

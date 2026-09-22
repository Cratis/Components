// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@cratis/fundamentals';
import { GuidField } from '../../fields/GuidField';

interface SampleValues {
    sampleId: Guid;
    optionalId?: Guid;
    nullableId: Guid | null;
    sampleIds: Guid[];
    name: string;
}

export const requiredField = <GuidField<SampleValues> value={(command) => command.sampleId} />;
export const optionalField = <GuidField<SampleValues> value={(command) => command.optionalId} />;
export const nullableField = <GuidField<SampleValues> value={(command) => command.nullableId} />;
// @ts-expect-error A Guid field cannot bind a string property.
export const stringField = <GuidField<SampleValues> value={(command) => command.name} />;
// @ts-expect-error A Guid field cannot bind an array property.
export const arrayField = <GuidField<SampleValues> value={(command) => command.sampleIds} />;

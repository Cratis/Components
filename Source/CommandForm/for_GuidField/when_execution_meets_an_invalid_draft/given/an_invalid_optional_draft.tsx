// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@cratis/fundamentals';
import { a_guid_form, sampleGuid } from '../../given/a_guid_form';

/**
 * An optional Guid whose valid value was replaced by a partial draft, so the command value is empty
 * and only the field's custom format error stands between the draft and execution.
 */
export class an_invalid_optional_draft extends a_guid_form {
    constructor() {
        super();
        beforeEach(async () => {
            await this.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
            await this.edit('partial');
        });
    }
}

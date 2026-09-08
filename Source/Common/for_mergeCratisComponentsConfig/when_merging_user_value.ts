// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mergeCratisComponentsConfig } from '../CratisComponentsProvider';

describe('when merging user value', () => {
    const userPt = { dialog: { root: { className: 'consumer-dialog' } } };
    let withoutValue: Record<string, unknown>;
    let withValue: Record<string, unknown>;

    beforeEach(() => {
        withoutValue = mergeCratisComponentsConfig(undefined) as Record<string, unknown>;
        withValue = mergeCratisComponentsConfig({
            unstyled: true,
            ripple: true,
            pt: userPt,
        }) as Record<string, unknown>;
    });

    it('should return an object when no value is given', () => {
        withoutValue.should.not.be.undefined;
    });

    it('should include the renderer-independent defaults when no value is given', () => {
        withoutValue.locale!.should.equal('en-US');
        withoutValue.messages!.should.not.be.undefined;
    });

    it('should forward unstyled from user value', () => {
        withValue.unstyled!.should.equal(true);
    });

    it('should forward ripple from user value', () => {
        withValue.ripple!.should.equal(true);
    });

    it('should deep-merge pt from user value', () => {
        withValue.pt!.should.deep.equal(userPt);
    });
});

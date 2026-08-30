// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Guid } from '@cratis/fundamentals';
import { ChatAuthorKind } from '../ChatAuthorKind';
import type { ChatMessage } from '../ChatMessage';
import { FailedReply, type FailedReplyReportDetails } from '../FailedReply';

const message: ChatMessage = {
    id: Guid.create(),
    authorId: Guid.create(),
    authorName: 'Modeler',
    authorInitials: 'M',
    hasAvatar: false,
    authorKind: ChatAuthorKind.Agent,
    text: '',
    timestamp: new Date('2026-01-02T03:04:05Z'),
    failureDetail: 'NoModelForAgent: No model & no key.',
};

describe('when a turn ended in failure and no report URL builder is given', () => {
    let html: string;

    beforeEach(() => {
        html = renderToStaticMarkup(React.createElement(FailedReply, { message }));
    });

    it('should say who could not answer', () => html.should.contain('Modeler could not answer'));
    it('should offer to show the error', () => html.should.contain('See error'));
    it('should not offer to report it', () => html.should.not.contain('Report a bug'));
    it('should not show the error before it is asked for', () => html.should.not.contain('<pre'));
});

describe('when a turn ended in failure and a report URL builder is given', () => {
    let html: string;
    let receivedDetails: FailedReplyReportDetails | undefined;

    beforeEach(() => {
        receivedDetails = undefined;
        html = renderToStaticMarkup(React.createElement(FailedReply, {
            message,
            buildReportUrl: (details: FailedReplyReportDetails) => {
                receivedDetails = details;
                return 'https://issues.example.com/new?title=' + encodeURIComponent(details.title);
            },
        }));
    });

    it('should offer to report it', () => html.should.contain('Report a bug'));
    it('should link to the URL the builder returned', () => html.should.contain('https://issues.example.com/new?title='));
    it('should carry the failure detail into the builder', () => receivedDetails!.detail.should.equal('NoModelForAgent: No model & no key.'));
    it('should carry the message id as the comment id, so the turn can be found in the logs', () =>
        receivedDetails!.commentId.should.equal(message.id.toString()));
    it('should substitute the author name into the report title', () => receivedDetails!.title.should.contain('Modeler'));
});

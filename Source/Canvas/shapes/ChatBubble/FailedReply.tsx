// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../../../Dialogs/Dialog';
import type { ChatMessage } from './ChatMessage';
import { FaTriangleExclamation } from 'react-icons/fa6';

/** The pieces of a would-be issue report, handed to {@link FailedReplyProps.buildReportUrl}. */
export interface FailedReplyReportDetails {

    /** A one-line title for the report. */
    title: string;

    /** A short summary of what went wrong. */
    summary: string;

    /** The raw failure detail from the message. */
    detail: string;

    /** The identifier of the message whose turn failed, so the turn can be traced by it. */
    commentId: string;
}

/** Overrides for the failure line's own labels. Any field left unset falls back to a literal English
 *  default. A `{name}` placeholder is substituted with the message's author name. */
export interface FailedReplyLabels {
    /** Defaults to `'{name} could not answer'`. */
    replyFailed?: string;
    /** Defaults to `'See error'`. */
    seeError?: string;
    /** Defaults to `'Report a bug'`. Only rendered when {@link FailedReplyProps.buildReportUrl} is given. */
    report?: string;
    /** Title of the "see error" dialog. Defaults to `'Why {name} could not answer'`. */
    errorTitle?: string;
    /** The report's own title, passed to {@link FailedReplyProps.buildReportUrl}. Defaults to
     *  `'"{name}" could not answer a comment'`. */
    reportTitle?: string;
    /** The report's own summary, passed to {@link FailedReplyProps.buildReportUrl}. Defaults to
     *  `'{name} failed while answering a comment. The error it reported follows.'`. */
    reportSummary?: string;
    /** Close button label on the "see error" dialog. Defaults to `'Close'`. */
    close?: string;
}

export interface FailedReplyProps {

    /** The message whose turn ended in failure; its `failureDetail` carries the reason. */
    message: ChatMessage;

    /**
     * Builds the href for a "report this" link from the failure's details. Omit to hide the report
     * action entirely — this library has no issue tracker of its own to link, so a host opts in by
     * passing its own report URL builder.
     */
    buildReportUrl?: (details: FailedReplyReportDetails) => string;

    /** Overrides for the failure line's labels. Unset fields fall back to literal English defaults. */
    labels?: FailedReplyLabels;
}

/**
 * The line a failed turn leaves behind, standing where the answer would have been. It says plainly
 * that the answer never came, and offers the two things somebody staring at it actually wants: the
 * error itself, and — when the host wires up {@link FailedReplyProps.buildReportUrl} — a way to report
 * it without transcribing anything by hand.
 */
export const FailedReply = ({ message, buildReportUrl, labels }: FailedReplyProps) => {
    const [detailShown, setDetailShown] = useState(false);
    const detail = message.failureDetail ?? '';
    const withName = (text: string) => text.replace('{name}', message.authorName);

    const reportUrl = buildReportUrl?.({
        title: withName(labels?.reportTitle ?? '"{name}" could not answer a comment'),
        summary: withName(labels?.reportSummary ?? '{name} failed while answering a comment. The error it reported follows.'),
        detail,
        // The comment the failed turn was written as is the only identifier the reply carries, and it
        // is what the turn can be traced by on the server.
        commentId: message.id.toString(),
    });

    return (
        <div className='chat-failed-reply' aria-live='polite'>
            <div className='chat-failed-reply__line'>
                <FaTriangleExclamation
                    className='chat-failed-reply__icon'
                    aria-hidden='true'
                />
                <span className='chat-failed-reply__text'>{withName(labels?.replyFailed ?? '{name} could not answer')}</span>
            </div>
            <div className='chat-failed-reply__actions'>
                <button type='button' className='chat-failed-reply__action' onClick={() => setDetailShown(true)}>
                    {labels?.seeError ?? 'See error'}
                </button>
                {reportUrl && (
                    <a
                        className='chat-failed-reply__action'
                        href={reportUrl}
                        target='_blank'
                        rel='noreferrer'>
                        {labels?.report ?? 'Report a bug'}
                    </a>
                )}
            </div>
            {detailShown && (
                <Dialog
                    title={withName(labels?.errorTitle ?? 'Why {name} could not answer')}
                    width='40rem'
                    buttons={DialogButtons.Ok}
                    okLabel={labels?.close ?? 'Close'}
                    onConfirm={() => setDetailShown(false)}
                    onCancel={() => setDetailShown(false)}>
                    <pre className='chat-failed-reply__detail'>{detail}</pre>
                </Dialog>
            )}
        </div>
    );
};

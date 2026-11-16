// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dialog as AriaDialog } from 'react-aria-components/Dialog';
import type React from 'react';
import { classNames } from '../ClassNames/classNames';
import { DialogStackContext } from '../renderer/DialogStackContext';
import { DialogFooter, type DialogFooterProps } from './DialogFooter';
import { DialogHeader, type DialogHeaderProps } from './DialogHeader';
import type { DialogParts } from './Dialog';

// Inline rather than in Dialog.css: the packed aggregate stylesheet has a reviewed size budget.
const visuallyHidden: React.CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: 0,
};

interface Announcement {
    key: number;
    text: string;
}

interface DialogContentProps {
    visible: boolean;
    isBusy: boolean;
    contentStyle: React.CSSProperties | undefined;
    pt: DialogParts | undefined;
    children: React.ReactNode;
}

const DialogContent = ({ visible, isBusy, contentStyle, pt, children }: DialogContentProps) => (
    <div
        {...pt?.content}
        className={classNames('cratis-dialog__content', pt?.content?.className)}
        style={{ ...pt?.content?.style, ...contentStyle }}
        data-cratis-part='content'
        data-open={visible || undefined}
        data-busy={isBusy || undefined}
    >
        <fieldset
            className='cratis-dialog__busy-scope'
            data-cratis-part='busy-scope'
            data-busy={isBusy || undefined}
            disabled={isBusy}
            inert={isBusy}
            aria-busy={isBusy || undefined}
        >
            {children}
        </fieldset>
    </div>
);

const LiveRegion = ({ announcement }: { announcement: Announcement | null }) => (
    <div
        className='cratis-dialog__live-region'
        style={visuallyHidden}
        role='status'
        aria-live='polite'
        aria-atomic='true'
    >
        {announcement && <span key={announcement.key}>{announcement.text}</span>}
    </div>
);

/** Props of the dialog document. */
export interface DialogDocumentProps {
    header: DialogHeaderProps;
    /** The footer, or null when the dialog has no footer. */
    footer: DialogFooterProps | null;
    stackZIndex: string;
    visible: boolean;
    contentStyle: React.CSSProperties | undefined;
    announcement: Announcement | null;
    children: React.ReactNode;
}

/** The accessible dialog document: header, content, footer and the status live region. */
export const DialogDocument = ({
    header,
    footer,
    stackZIndex,
    visible,
    contentStyle,
    announcement,
    children,
}: DialogDocumentProps) => (
    <DialogStackContext.Provider value={stackZIndex}>
        <AriaDialog
            className='cratis-dialog__document'
            aria-describedby={header.hasSubtitle ? header.subtitleId : undefined}
        >
            <>
                <DialogHeader {...header} />
                <DialogContent visible={visible} isBusy={header.isBusy} contentStyle={contentStyle} pt={header.pt}>
                    {children}
                </DialogContent>
                {footer && <DialogFooter {...footer} />}
                <LiveRegion announcement={announcement} />
            </>
        </AriaDialog>
    </DialogStackContext.Provider>
);

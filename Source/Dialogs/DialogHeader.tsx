// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Heading } from 'react-aria-components/Dialog';
import type React from 'react';
import { dialogPartAttributes } from './dialogPartAttributes';
import type { DialogHeaderActionsRenderer } from '../configuration/DialogHeaderActionsRenderer';
import { DialogGlobalHeaderActions } from './DialogGlobalHeaderActions';
import type { DialogParts, DialogProps } from './Dialog';

// Header actions sit in the close button's grid column, to its left. Inline rather than in Dialog.css:
// the packed aggregate stylesheet has a reviewed size budget.
const headerActionsStyle = (hasCloseButton: boolean, style: React.CSSProperties | undefined): React.CSSProperties => ({
    display: 'inline-flex',
    gridColumn: 2,
    gridRow: 1,
    justifySelf: 'end',
    alignItems: 'center',
    gap: '0.25rem',
    marginInlineEnd: hasCloseButton ? '2.25rem' : undefined,
    ...style,
});


interface HeaderActionsProps {
    dialogId: string;
    title: DialogProps['title'];
    headerActions: DialogProps['headerActions'];
    globalHeaderActions: DialogHeaderActionsRenderer | undefined;
    hideGlobalHeaderActions: boolean;
    isCommandDialog: boolean;
    sliceLocation: DialogProps['sliceLocation'];
    showsCloseButton: boolean;
    pt: DialogParts | undefined;
}

const HeaderActions = ({
    dialogId,
    title,
    headerActions,
    globalHeaderActions,
    hideGlobalHeaderActions,
    isCommandDialog,
    sliceLocation,
    showsCloseButton,
    pt,
}: HeaderActionsProps) => (
    <div
        {...dialogPartAttributes(pt?.headerActions, 'cratis-dialog__header-actions', headerActionsStyle(showsCloseButton, pt?.headerActions?.style))}
        data-cratis-part='header-actions'
    >
        {headerActions}
        {globalHeaderActions && !hideGlobalHeaderActions && (
            <DialogGlobalHeaderActions
                render={globalHeaderActions}
                context={{ dialogId, title, isCommandDialog, sliceLocation }}
            />
        )}
    </div>
);

const closeButtonStyle = (hasHeaderActions: boolean, style: React.CSSProperties | undefined) =>
    hasHeaderActions ? { justifySelf: 'end' as const, ...style } : style;

interface CloseButtonProps {
    isBusy: boolean;
    hasHeaderActions: boolean;
    ariaLabel: string;
    icon: React.ReactNode;
    pt: DialogParts | undefined;
    onClose: () => void;
}

const CloseButton = ({ isBusy, hasHeaderActions, ariaLabel, icon, pt, onClose }: CloseButtonProps) => (
    <button
        {...dialogPartAttributes(pt?.close, 'cratis-dialog__close', closeButtonStyle(hasHeaderActions, pt?.close?.style))}
        type='button'
        disabled={isBusy}
        data-cratis-part='close'
        data-disabled={isBusy || undefined}
        data-busy={isBusy || undefined}
        aria-label={ariaLabel}
        onClick={onClose}
    >
        <span aria-hidden='true'>{icon}</span>
    </button>
);

interface TitleProps {
    title: DialogProps['title'];
    focusesTitle: boolean;
    titleRef: React.Ref<HTMLHeadingElement>;
    pt: DialogParts | undefined;
}

const Title = ({ title, focusesTitle, titleRef, pt }: TitleProps) => (
    <Heading
        {...dialogPartAttributes(pt?.title, 'cratis-dialog__title')}
        slot='title'
        tabIndex={focusesTitle ? -1 : undefined}
        ref={titleRef}
        data-cratis-part='title'
    >
        {title}
    </Heading>
);

interface SubtitleProps {
    subtitle: DialogProps['subtitle'];
    subtitleId: string;
    pt: DialogParts | undefined;
}

const Subtitle = ({ subtitle, subtitleId, pt }: SubtitleProps) => (
    <p
        {...dialogPartAttributes(pt?.subtitle, 'cratis-dialog__subtitle')}
        id={subtitleId}
        data-cratis-part='subtitle'
    >
        {subtitle}
    </p>
);

/** Props of the dialog header. */
export interface DialogHeaderProps extends HeaderActionsProps {
    subtitle: DialogProps['subtitle'];
    subtitleId: string;
    hasSubtitle: boolean;
    hasHeaderActions: boolean;
    focusesTitle: boolean;
    titleRef: React.Ref<HTMLHeadingElement>;
    isBusy: boolean;
    closeAriaLabel: string;
    closeIcon: React.ReactNode;
    onClose: () => void;
}

/** The dialog header: title, subtitle, header actions and the close button. */
export const DialogHeader = (props: DialogHeaderProps) => {
    const { pt, title, subtitle, subtitleId, hasSubtitle, hasHeaderActions, focusesTitle, titleRef } = props;
    const { showsCloseButton, isBusy, closeAriaLabel, closeIcon, onClose } = props;

    return (
        <header
            {...dialogPartAttributes(pt?.header, 'cratis-dialog__header')}
            data-cratis-part='header'
        >
            <Title title={title} focusesTitle={focusesTitle} titleRef={titleRef} pt={pt} />
            {hasSubtitle && <Subtitle subtitle={subtitle} subtitleId={subtitleId} pt={pt} />}
            {hasHeaderActions && <HeaderActions {...props} />}
            {showsCloseButton && (
                <CloseButton
                    isBusy={isBusy}
                    hasHeaderActions={hasHeaderActions}
                    ariaLabel={closeAriaLabel}
                    icon={closeIcon}
                    pt={pt}
                    onClose={onClose}
                />
            )}
        </header>
    );
};

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { classNames } from '../ClassNames/classNames';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { ChatSidebarLabels, ChatSidebarParts } from './ChatSidebar';
import type { ChatTopic } from './ChatTopic';

interface ChatSidebarHeaderProps<TTopic extends ChatTopic> {
    openTopicId: unknown;
    openTopic: TTopic | undefined;
    unnamed: (topic: TTopic) => boolean;
    headerActions: ReactNode;
    labels?: ChatSidebarLabels;
    pt?: ChatSidebarParts;
    onBack: () => void;
    onClose: () => void;
}

const BackIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        aria-hidden='true'
    >
        <line x1='19' y1='12' x2='5' y2='12' />
        <polyline points='12 19 5 12 12 5' />
    </svg>
);

const resolveTitle = <TTopic extends ChatTopic>(
    isListShown: boolean,
    openTopic: TTopic | undefined,
    unnamed: (topic: TTopic) => boolean,
    labels?: ChatSidebarLabels,
) => {
    if (isListShown) return labels?.topics ?? 'Topics';
    if (openTopic && !unnamed(openTopic)) return openTopic.name;
    return labels?.unnamedTopic ?? 'New topic';
};

interface HeaderButtonProps {
    label?: string;
    pt?: ChatSidebarParts;
    onClick: () => void;
}

const BackButton = ({ label, pt, onClick }: HeaderButtonProps) => (
    <button
        {...pt?.back}
        type='button'
        className={classNames('cratis-chat-sidebar__back', pt?.back?.className)}
        data-cratis-part='back'
        title={label ?? 'Back to topics'}
        aria-label={label ?? 'Back to topics'}
        onClick={onClick}
    >
        <BackIcon />
    </button>
);

const CloseButton = ({ label, pt, onClick }: HeaderButtonProps) => {
    const icon = useCratisIcon();
    return (
        <button
            {...pt?.close}
            type='button'
            className={classNames('cratis-chat-sidebar__close', pt?.close?.className)}
            data-cratis-part='close'
            aria-label={label ?? 'Close chat'}
            onClick={onClick}
        >
            <span aria-hidden='true'>{icon('close', '×')}</span>
        </button>
    );
};

interface TitleProps {
    isPending: boolean;
    pt?: ChatSidebarParts;
    children: ReactNode;
}

const Title = ({ isPending, pt, children }: TitleProps) => (
    <h2
        {...pt?.title}
        className={classNames(
            'cratis-chat-sidebar__title',
            isPending ? 'cratis-chat-sidebar__title--pending' : undefined,
            pt?.title?.className,
        )}
        data-cratis-part='title'
    >
        {children}
    </h2>
);

export const ChatSidebarHeader = <TTopic extends ChatTopic>({
    openTopicId,
    openTopic,
    unnamed,
    headerActions,
    labels,
    pt,
    onBack,
    onClose,
}: ChatSidebarHeaderProps<TTopic>) => {
    const isListShown = openTopicId === undefined;
    const titleIsPending = !isListShown && (!openTopic || unnamed(openTopic));

    return (
        <header
            {...pt?.header}
            className={classNames('cratis-chat-sidebar__header', pt?.header?.className)}
            data-cratis-part='header'
        >
            {!isListShown && <BackButton label={labels?.back} pt={pt} onClick={onBack} />}
            <Title isPending={titleIsPending} pt={pt}>
                {resolveTitle(isListShown, openTopic, unnamed, labels)}
            </Title>
            {headerActions}
            <CloseButton label={labels?.close} pt={pt} onClick={onClose} />
        </header>
    );
};

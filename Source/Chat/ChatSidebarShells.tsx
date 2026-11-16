// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Modal, ModalOverlay } from 'react-aria-components';
import { classNames } from '../ClassNames/classNames';
import type { ChatSidebarParts } from './ChatSidebar';
import type { NonModalPhase } from './useNonModalPhase';

interface ChatSidebarShellProps {
    open: boolean;
    hasOpenTopic: boolean;
    position: 'left' | 'right';
    width: string;
    className?: string;
    pt?: ChatSidebarParts;
    children: ReactNode;
}

interface ModalChatSidebarProps extends ChatSidebarShellProps {
    onClose: () => void;
}

interface NonModalChatSidebarProps extends ChatSidebarShellProps {
    phase: NonModalPhase;
    panelRef: RefObject<HTMLDivElement | null>;
    portalContainer: Element | null;
    onPhaseSettled: (update: (phase: NonModalPhase) => NonModalPhase) => void;
}

const settleAnimation = (phase: NonModalPhase): NonModalPhase => {
    if (phase === 'entering') return 'open';
    return phase === 'exiting' ? 'closed' : phase;
};

const panelAttributes = (shell: ChatSidebarShellProps) => ({
    ...shell.pt?.root,
    className: classNames('cratis-chat-sidebar', shell.pt?.root?.className, shell.className),
    style: { width: shell.width, ...shell.pt?.root?.style },
    'data-position': shell.position,
});

const backdropAttributes = (pt?: ChatSidebarParts) => ({
    ...pt?.backdrop,
    className: classNames('cratis-chat-sidebar__backdrop', pt?.backdrop?.className),
});

const phaseAttributes = (phase: NonModalPhase) => ({
    'data-entering': phase === 'entering' || undefined,
    'data-exiting': phase === 'exiting' || undefined,
});

const ModalPanel = (shell: ChatSidebarShellProps) => (
    <Modal
        {...panelAttributes(shell)}
        data-cratis-part='root'
        data-cratis-component='ChatSidebar'
        data-open={shell.open || undefined}
        data-selected={shell.hasOpenTopic || undefined}
    >
        {shell.children}
    </Modal>
);

export const ModalChatSidebar = ({ onClose, ...shell }: ModalChatSidebarProps) => (
    <ModalOverlay
        {...backdropAttributes(shell.pt)}
        isOpen={shell.open}
        onOpenChange={(openState) => {
            if (!openState) onClose();
        }}
        isDismissable
        isKeyboardDismissDisabled={false}
        data-cratis-part='backdrop'
        data-modal
        data-open={shell.open || undefined}
        data-selected={shell.hasOpenTopic || undefined}
    >
        <ModalPanel {...shell} />
    </ModalOverlay>
);

interface NonModalPanelProps extends ChatSidebarShellProps {
    phase: NonModalPhase;
    panelRef: RefObject<HTMLDivElement | null>;
    onPhaseSettled: (update: (phase: NonModalPhase) => NonModalPhase) => void;
}

const NonModalPanel = ({ panelRef, onPhaseSettled, ...shell }: NonModalPanelProps) => (
    <div
        {...panelAttributes(shell)}
        {...phaseAttributes(shell.phase)}
        ref={panelRef}
        data-cratis-part='root'
        data-cratis-component='ChatSidebar'
        data-open={shell.open || undefined}
        data-selected={shell.hasOpenTopic || undefined}
        onAnimationEnd={(event) => {
            shell.pt?.root?.onAnimationEnd?.(event);
            if (event.target !== event.currentTarget) return;
            onPhaseSettled(settleAnimation);
        }}
    >
        {shell.children}
    </div>
);

/**
 * Non-modal: a chat lives *next to* the work, so the background must stay visible and
 * interactive. React Aria's Modal blocks its backdrop by design (its dismissal props only
 * gate how it closes, never whether it intercepts), so this is a plain portaled layer with
 * no dismissal behavior at all — only the close/back affordances dismiss it.
 */
export const NonModalChatSidebar = ({ portalContainer, ...panel }: NonModalChatSidebarProps) => {
    if (panel.phase === 'closed' || !portalContainer) return null;

    return createPortal(
        <div
            {...backdropAttributes(panel.pt)}
            {...phaseAttributes(panel.phase)}
            data-cratis-part='backdrop'
            data-modal={false}
            data-open={panel.open || undefined}
            data-selected={panel.hasOpenTopic || undefined}
        >
            <NonModalPanel {...panel} />
        </div>,
        portalContainer,
    );
};

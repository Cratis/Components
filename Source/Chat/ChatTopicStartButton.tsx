// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const PlusIcon = () => (
    <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        aria-hidden='true'
    >
        <line x1='12' y1='5' x2='12' y2='19' />
        <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
);

interface ChatTopicStartButtonProps {
    label?: string;
    disabled: boolean;
    onStart: () => void;
}

export const ChatTopicStartButton = ({ label, disabled, onStart }: ChatTopicStartButtonProps) => (
    <button type='button' className='cratis-chat-topics__start' disabled={disabled} onClick={onStart}>
        <PlusIcon />
        <span>{label ?? 'New topic'}</span>
    </button>
);

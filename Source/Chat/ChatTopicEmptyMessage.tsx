// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatTopicListLabels } from './ChatTopicList';
import { ChatStatus } from './ChatStatus';

interface ChatTopicEmptyMessageProps {
    status: ChatStatus;
    labels?: ChatTopicListLabels;
}

const StatusText = ({ status, labels }: ChatTopicEmptyMessageProps) => {
    if (status === ChatStatus.Loading) {
        return <span key={status} role='status'>{labels?.loading ?? 'Loading topics…'}</span>;
    }
    if (status === ChatStatus.Failed) {
        return <span key={status} role='alert'>{labels?.failed ?? 'Could not load topics.'}</span>;
    }
    if (status === ChatStatus.Unauthorized) {
        return <span key={status} role='alert'>{labels?.unauthorized ?? 'You are not authorized to view these topics.'}</span>;
    }
    return <>{labels?.empty ?? 'No topics yet. Start the first one!'}</>;
};

export const ChatTopicEmptyMessage = (props: ChatTopicEmptyMessageProps) => (
    <p className='cratis-chat-topics__empty'>
        <StatusText {...props} />
    </p>
);

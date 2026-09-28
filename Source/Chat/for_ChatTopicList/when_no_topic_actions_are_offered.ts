// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatTopicList } from '../ChatTopicList';
import { render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

describe('when no topic actions are offered', () => {
    let list: TopicListInTheDom;

    beforeEach(async () => {
        list = await render(createElement(ChatTopicList, {
            topics: [{ id: 'topic-1', name: 'Example topic' }],
            onOpen: () => {},
        }));
    });

    afterEach(async () => { await unmount(list); });

    it('should retain the existing topic markup', () => {
        list.container.innerHTML.should.equal('<div class="cratis-chat-topics"><ul class="cratis-chat-topics__list"><li><button type="button" class="cratis-chat-topics__topic"><span class="cratis-chat-topics__details"><span class="cratis-chat-topics__name">Example topic</span></span></button></li></ul></div>');
    });
});

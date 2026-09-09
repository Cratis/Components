// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../Kit/ChatAuthorKind';
import { ChatSidebar } from '../ChatSidebar';
import type { ChatTopic } from '../ChatTopic';
import {
    click,
    render,
    unmount,
    type ChatSidebarInTheDom,
} from './given/a_chat_sidebar_in_the_dom';

const planning: ChatTopic = {
    id: 'topic-1',
    name: 'Sprint planning',
    lastActivity: new Date('2026-08-27T10:00:00Z'),
};

const backgroundButton = () =>
    document.querySelector<HTMLButtonElement>('[data-test="background"]')!;

describe('when the sidebar is open', () => {
    let backgroundClicks = 0;
    let sidebar: ChatSidebarInTheDom;

    const renderWith = async (props: Record<string, unknown>) => {
        backgroundClicks = 0;
        return render(
            createElement(
                'div',
                null,
                createElement(
                    'button',
                    {
                        'data-test': 'background',
                        onClick: () => {
                            backgroundClicks += 1;
                        },
                    },
                    'Background control',
                ),
                createElement(ChatSidebar, {
                    open: true,
                    onClose: () => {},
                    topics: [planning],
                    messages: [],
                    onSendMessage: () => {},
                    authorOf: () => ({
                        name: 'Sample User',
                        kind: ChatAuthorKind.User,
                    }),
                    ...props,
                }),
            ),
        );
    };

    afterEach(async () => {
        await unmount(sidebar);
    });

    describe('and it is not modal', () => {
        beforeEach(async () => {
            sidebar = await renderWith({});
        });

        it('should leave the background in the accessibility tree', () => {
            backgroundButton().hasAttribute('aria-hidden').should.be.false;
        });

        it('should not present itself as a dialog', () => {
            (document.querySelector('[role="dialog"]') === null).should.be.true;
            (document.querySelector('[aria-modal]') === null).should.be.true;
        });

        it('should still expose the open state on the sidebar frame', () => {
            document
                .querySelector('[data-cratis-part="backdrop"]')!
                .getAttribute('data-modal')!
                .should.equal('false');
            document
                .querySelector('[data-cratis-part="backdrop"]')!
                .getAttribute('data-open')!
                .should.equal('true');
            document
                .querySelector('[data-cratis-part="root"]')!
                .getAttribute('data-open')!
                .should.equal('true');
        });

        it('should let the background stay interactive', async () => {
            await click(backgroundButton());
            backgroundClicks.should.equal(1);
        });
    });

    describe('and it is modal', () => {
        beforeEach(async () => {
            sidebar = await renderWith({ modal: true });
        });

        it('should hide the background from the accessibility tree', () => {
            (
                backgroundButton().closest('[aria-hidden="true"]') !== null
            ).should.be.true;
        });

        it('should mount the modal overlay frame', () => {
            (
                document.querySelector('[data-cratis-part="backdrop"]')!
                    .hasAttribute('data-rac')
            ).should.be.true;
        });
    });
});

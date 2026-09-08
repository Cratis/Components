// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * How a conversation is presented.
 */
export enum ChatVariant {

    /** A floating card hanging off whatever opened it. */
    Floating = 'floating',

    /** Filling a container that already provides its own frame and heading, such as a sidebar. */
    Docked = 'docked',
}

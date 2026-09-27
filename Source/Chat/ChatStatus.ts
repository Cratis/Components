// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Display state of a chat topic list or conversation. */
export enum ChatStatus {
    /** Shows topics or messages, or the empty state when nothing is pending. */
    Ready = 'ready',
    /** Shows a loading message without data, or retains existing content during a refetch. */
    Loading = 'loading',
    /** Shows a failure alert, alongside any existing topics or messages kept after a failure. */
    Failed = 'failed',
    /** Shows an access-denied message instead of existing content. */
    Unauthorized = 'unauthorized',
}

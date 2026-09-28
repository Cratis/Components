// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Whether an Arc query result is ready. Arc versions that predate `isReady` never set it, and
 * those results are ready; only an explicit `isReady: false` marks a transient not-ready result.
 * @param result The Arc query result.
 * @returns True unless the result explicitly reports that it is not ready.
 */
export const isQueryResultReady = (result: { isReady?: boolean }): boolean => result.isReady !== false;

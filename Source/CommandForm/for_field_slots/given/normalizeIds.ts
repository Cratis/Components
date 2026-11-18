// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Replaces React's generated `useId` values so markup can be compared to a golden string. */
export const normalizeIds = (html: string) => html.replace(/_R_[0-9A-Za-z]*_/g, 'ID');

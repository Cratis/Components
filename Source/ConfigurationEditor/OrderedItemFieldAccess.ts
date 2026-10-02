// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What a host lets a person do with one field.
 *
 * - `'editable'` — the field has an input.
 * - `'readonly'` — the value is shown as text and cannot change.
 * - `'hidden'` — the field is not shown. This is also the meaning of a field the host leaves out.
 */
export type OrderedItemFieldAccess = 'editable' | 'readonly' | 'hidden';

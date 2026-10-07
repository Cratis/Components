// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Which editor a {@link SchemaEditor} renders. `'table'` is the breadcrumb-navigated table with an Edit, Save and
 * Cancel workflow and the default; `'tree'` is the inline tree that applies every edit live.
 */
export type SchemaEditorLayout = 'table' | 'tree';

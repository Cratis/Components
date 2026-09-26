// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { LayoutResult } from '../../engine/types';
import { syncSpritesToViewport, type SyncParams } from './visibility';

/** Keep the scroll path's transition layout in sync with the normal render path. */
export function syncScrollSprites<TItem>(params: Omit<SyncParams<TItem>, 'prevLayout'>, previousLayout: LayoutResult | null) {
    syncSpritesToViewport({ ...params, prevLayout: previousLayout });
}

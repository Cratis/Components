// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { AnchoredOverlayProps } from './AnchoredOverlay';

export type OverlayPlacementOptions = Required<Pick<AnchoredOverlayProps, 'side' | 'align' | 'gap'>>;

// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Evidence families emitted by the renderer conformance runner. */
export enum ConformanceFamily {
    Manifest = 'manifest',
    Contract = 'contract',
    Behavior = 'behavior',
    BehaviorOwnership = 'behaviorOwnership',
    ReactNormalization = 'reactNormalization',
    ServerRendering = 'ssr',
    Accessibility = 'a11y',
    TypePurity = 'typePurity',
}

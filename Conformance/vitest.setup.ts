// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { should } from 'chai';

should();
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
}

if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
}

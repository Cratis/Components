// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useId, useRef, useState } from 'react';
import { observeLabelAssociations } from './observeLabelAssociations';

/** Resolves native labels after commit and keeps independently updated label associations current. */
export function useExternalLabel() {
    const generatedId = useId();
    const nextLabelIdRef = useRef(0);
    const unsubscribeRef = useRef<(() => void) | undefined>(undefined);
    const [labelledBy, setLabelledBy] = useState<string>();
    const update = useCallback((element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement) => {
        const ids = Array.from(element.labels ?? [], label => {
            // Allocation is independent of label order: prepending an id-less label must not
            // reuse the id of a label that was already associated with this control.
            if (!label.id) label.id = `${generatedId}-label-${nextLabelIdRef.current++}`;
            return label.id;
        });
        const next = ids.join(' ') || undefined;
        setLabelledBy(previous => previous === next ? previous : next);
    }, [generatedId]);
    const ref = useCallback((element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement | null) => {
        unsubscribeRef.current?.();
        unsubscribeRef.current = undefined;
        if (!element) return;
        // Subscribe before reading: another component's layout effect may change labels in
        // this same commit. Ref detachment releases the subscription on replacement/unmount.
        unsubscribeRef.current = observeLabelAssociations(element, () => update(element));
        update(element);
    }, [update]);

    return { labelledBy, ref };
}

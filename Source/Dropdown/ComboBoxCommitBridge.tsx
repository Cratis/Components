// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext, useEffect } from 'react';
import type { RefObject } from 'react';
import { ComboBoxStateContext } from 'react-aria-components/ComboBox';

/** The part of the ComboBox lifecycle a commit has to reach, from outside the ComboBox subtree. */
export interface CommittableComboBox {
    close: () => void;
}

/**
 * Publishes the ComboBox state to the commit handler, which is declared outside the ComboBox and so
 * cannot read the context itself. Renders nothing.
 */
export const ComboBoxCommitBridge = ({
    handle,
}: {
    handle: RefObject<CommittableComboBox | null>;
}) => {
    const state = useContext(ComboBoxStateContext);
    useEffect(() => {
        handle.current = state;
        return () => {
            handle.current = null;
        };
    });
    return null;
};

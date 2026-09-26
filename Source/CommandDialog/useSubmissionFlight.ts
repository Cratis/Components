// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

/** Tracks busy state and guards re-entry while a confirmation is pending. */
export const useSubmissionFlight = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inFlight = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const begin = (exclusive: boolean) => {
        if (exclusive && (!mounted.current || inFlight.current)) return false;
        if (exclusive) inFlight.current = true;
        if (mounted.current) setIsSubmitting(true);
        return true;
    };

    const finish = () => {
        inFlight.current = false;
        // Result and exception callbacks must observe an idle dialog, even within a React event batch.
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- The busy prop must settle before consumer callbacks.
        if (mounted.current) flushSync(() => setIsSubmitting(false));
    };

    return { isSubmitting, begin, finish, isMounted: () => mounted.current };
};

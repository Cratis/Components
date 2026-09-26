// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';

/** Tracks a submission synchronously so rapid clicks cannot start a second flight. */
export const useSubmissionFlight = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inFlight = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const begin = () => {
        if (!mounted.current || inFlight.current) return false;
        inFlight.current = true;
        setIsSubmitting(true);
        return true;
    };

    const finish = () => {
        inFlight.current = false;
        if (mounted.current) setIsSubmitting(false);
    };

    return { isSubmitting, begin, finish, isMounted: () => mounted.current };
};

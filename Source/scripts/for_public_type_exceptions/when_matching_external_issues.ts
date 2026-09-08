// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, expect, it } from 'vitest';
import {
    matchesExternalIssue,
    matchesPairedOwnedCascade,
} from '../lib/public-type-exceptions.mjs';

const issue = {
    diagnosticCodes: ['TS2305', 'TS2834', 'TS2835'],
    filePrefixes: ['@cratis/arc/'],
    messagePatterns: ['@cratis/arc'],
    ownedCascades: [
        {
            messagePattern: '@cratis/arc',
            rootCauseFilePrefix: '@cratis/arc/',
            rootCauseDiagnosticCodes: ['TS2834', 'TS2835'],
        },
    ],
};

const ownedDiagnostic = {
    code: 'TS2305',
    file: '@cratis/components/CommandDialog/index.d.ts',
    message: "Module '@cratis/arc' has no exported member 'CommandResult'.",
};

describe('when matching public type exceptions', () => {
    it('should match a diagnostic anchored in the reviewed upstream package', () => {
        expect(
            matchesExternalIssue(
                {
                    code: 'TS2305',
                    file: '@cratis/arc/index.d.ts',
                    message: "Module './types' has no exported member 'CommandResult'.",
                },
                issue,
                '@cratis/components',
            ),
        ).toBe(true);
    });

    it('should match an upstream cascade anchored in the consumer fixture', () => {
        expect(
            matchesExternalIssue(
                {
                    code: 'TS2305',
                    file: 'fixture/consumer.mts',
                    message:
                        "Module '@cratis/arc' has no exported member 'CommandResult'.",
                },
                issue,
                '@cratis/components',
            ),
        ).toBe(true);
    });

    it('should never cover a Components diagnostic as an external diagnostic', () => {
        expect(matchesExternalIssue(ownedDiagnostic, issue, '@cratis/components')).toBe(
            false,
        );
    });

    it('should reject an owned cascade without its matching upstream root cause', () => {
        expect(
            matchesPairedOwnedCascade(ownedDiagnostic, issue, [], '@cratis/components'),
        ).toBe(false);
    });

    it('should reject an owned cascade paired to a different upstream package', () => {
        expect(
            matchesPairedOwnedCascade(
                ownedDiagnostic,
                issue,
                [
                    {
                        code: 'TS2835',
                        file: '@cratis/fundamentals/index.d.ts',
                        message: 'Relative import paths need explicit file extensions.',
                    },
                ],
                '@cratis/components',
            ),
        ).toBe(false);
    });

    it('should cover an owned cascade only with its matching upstream root cause', () => {
        expect(
            matchesPairedOwnedCascade(
                ownedDiagnostic,
                issue,
                [
                    {
                        code: 'TS2835',
                        file: '@cratis/arc/index.d.ts',
                        message: 'Relative import paths need explicit file extensions.',
                    },
                ],
                '@cratis/components',
            ),
        ).toBe(true);
    });
});

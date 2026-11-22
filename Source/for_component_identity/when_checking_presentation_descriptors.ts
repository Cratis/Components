// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../', import.meta.url));
const MINIMUM_DESCRIBED_COMPONENTS = 29;

const descriptorNames = (source: string): string[] =>
    [...source.matchAll(/describeComponent<\w+>\(\s*'(\w+)'/gu)].map((match) => match[1]);

const descriptorsIn = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
        return ['node_modules', 'dist'].includes(entry.name) || entry.name.startsWith('for_') || entry.name.startsWith('.')
            ? []
            : descriptorsIn(`${directory}${entry.name}/`);
    }
    return /\.tsx?$/u.test(entry.name) && !entry.name.includes('.stories.')
        ? descriptorNames(readFileSync(`${directory}${entry.name}`, 'utf8'))
        : [];
});

describe('when checking presentation descriptor coverage', () => {
    it('should recognize typed declarations rather than identity markers alone', () => {
        descriptorNames("describeComponent<ExampleProps>('Example', []); data-cratis-component='MarkerOnly'")
            .should.deep.equal(['Example']);
    });

    it('should retain at least twenty-nine statically described component types', () => {
        const described = new Set(descriptorsIn(sourceRoot));
        described.size.should.be.at.least(MINIMUM_DESCRIBED_COMPONENTS);
    });
});

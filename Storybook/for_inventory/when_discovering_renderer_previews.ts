// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import sourcePackage from '../../Source/package.json';
import adapterSchema from '../../Source/schemas/ui-adapter.schema.json';
import { discoverAdapterPackages } from '../scripts/lib/adapter-inventory.mjs';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');

describe('when discovering renderer previews', () => {
    it('should derive the required inventory from schema-valid workspace package metadata', () => {
        const inventory = discoverAdapterPackages(repositoryRoot);
        expect(inventory.adapters.map(adapter => adapter.metadata.id)).to.deep.equal([
            'cratis-built-in',
            'cratis-mui',
            'cratis-primereact10',
            'cratis-primereact',
        ]);
        expect(inventory.adapters.every(adapter => adapter.metadata.kind === 'ui-adapter')).to.equal(true);
    });

    it('should reject invalid adapter metadata using the published schema', () => {
        const invalid = { ...sourcePackage.cratis, level: 'unknown' };
        expect(validateAgainstSchema(invalid, adapterSchema)).not.to.be.empty;
    });

    it('should exclude a private adapter workspace without a Core inventory edit', () => {
        const root = mkdtempSync(path.join(os.tmpdir(), 'cratis-storybook-inventory-'));
        try {
            mkdirSync(path.join(root, 'Source/schemas'), { recursive: true });
            mkdirSync(path.join(root, 'Adapters/Plain'), { recursive: true });
            writeFileSync(path.join(root, 'package.json'), JSON.stringify({
                private: true,
                workspaces: ['Source', 'Adapters/*'],
            }));
            writeFileSync(path.join(root, 'Source/package.json'), JSON.stringify(sourcePackage));
            writeFileSync(path.join(root, 'Source/schemas/ui-adapter.schema.json'), JSON.stringify(adapterSchema));
            writeFileSync(path.join(root, 'Adapters/Plain/package.json'), JSON.stringify({
                name: '@cratis/components.plain',
                private: true,
                cratis: {
                    ...sourcePackage.cratis,
                    id: 'cratis-plain',
                    displayName: 'Private Plain fixture',
                    category: 'plain',
                },
            }));
            const inventory = discoverAdapterPackages(root);
            expect(inventory.adapters.map(adapter => adapter.metadata.id)).to.deep.equal(['cratis-built-in']);
            expect(inventory.exclusions).to.deep.equal([{
                packageName: '@cratis/components.plain',
                id: 'cratis-plain',
                reason: 'private workspace',
            }]);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});

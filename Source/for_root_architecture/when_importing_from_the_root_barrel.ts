// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import * as RootBarrel from '../index';

/**
 * Source-level contract for the setup-only root architecture (Cratis/Components root
 * architecture): the package root exports the application-wide provider, its
 * configuration/hook/merge helpers, and the config/provider/message interface family -
 * nothing else. Every component namespace lives behind its own explicit subpath only.
 * The codemod map parity specs own the complete namespace list so this runtime contract
 * cannot become another hand-maintained copy.
 *
 * This is the source-level half of the contract; `scripts/verify-public-types.mjs` and
 * `scripts/verify-no-pixi-consumer.mjs` verify the equivalent built/packed-artifact
 * boundary against the real declaration output and a real no-Pixi consumer.
 */
describe('when importing from the root barrel', () => {
    const allowedRootExports = [
        'CratisComponentsProvider',
        'useCratisComponentsConfig',
        'cratisDefaults',
        'mergeCratisComponentsConfig',
    ];

    it('should export exactly the setup-only allowlist and nothing else', () => {
        expect(Object.keys(RootBarrel).sort()).to.deep.equal(
            [...allowedRootExports].sort(),
        );
    });

    it('should export CratisComponentsProvider as a function component', () => {
        expect(RootBarrel.CratisComponentsProvider).to.be.a('function');
    });

    it('should export useCratisComponentsConfig as a hook function', () => {
        expect(RootBarrel.useCratisComponentsConfig).to.be.a('function');
    });

    it('should export mergeCratisComponentsConfig as a function', () => {
        expect(RootBarrel.mergeCratisComponentsConfig).to.be.a('function');
    });

    it('should export cratisDefaults as a resolved configuration object', () => {
        expect(RootBarrel.cratisDefaults).to.be.an('object');
        expect(RootBarrel.cratisDefaults.locale).to.equal('en-US');
    });
});

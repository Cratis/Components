// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as RootBarrel from '../index';

/**
 * Source-level contract for the setup-only root architecture (Cratis/Components root
 * architecture): the package root exports the application-wide provider, its
 * configuration/hook/merge helpers, and the config/provider/message interface family -
 * nothing else. Every component namespace (`Canvas`, `CommandDialog`, `CommandForm`,
 * `Common`, `DataPage`, `DataTables`, `Dialogs`, `Display`, `Dropdown`, `Filter`,
 * `Notifications`, `ObjectContentEditor`, `ObjectNavigationalBar`, `PivotViewer`,
 * `SchemaEditor`, `TimeMachine`, `Toolbar`, `Types`) lives behind its own explicit
 * subpath only.
 *
 * This is the source-level half of the contract; `scripts/verify-public-types.mjs` and
 * `scripts/verify-no-pixi-consumer.mjs` verify the equivalent built/packed-artifact
 * boundary against the real declaration output and a real no-Pixi consumer.
 */
describe('when importing from the root barrel', () => {
    const ALLOWED_ROOT_EXPORTS = [
        'CratisComponentsProvider',
        'useCratisComponentsConfig',
        'cratisDefaults',
        'mergeCratisComponentsConfig',
    ];

    it('should export exactly the setup-only allowlist and nothing else', () => {
        Object.keys(RootBarrel)
            .sort()
            .should.deep.equal([...ALLOWED_ROOT_EXPORTS].sort());
    });

    it('should export CratisComponentsProvider as a function component', () => {
        RootBarrel.CratisComponentsProvider.should.be.a('function');
    });

    it('should export useCratisComponentsConfig as a hook function', () => {
        RootBarrel.useCratisComponentsConfig.should.be.a('function');
    });

    it('should export mergeCratisComponentsConfig as a function', () => {
        RootBarrel.mergeCratisComponentsConfig.should.be.a('function');
    });

    it('should export cratisDefaults as a resolved configuration object', () => {
        RootBarrel.cratisDefaults.should.be.an('object');
        RootBarrel.cratisDefaults.locale!.should.equal('en-US');
    });

    it('should never export a component namespace from the root', () => {
        const forbiddenNamespaces = [
            'Canvas',
            'CommandDialog',
            'CommandStepper',
            'CommandForm',
            'Common',
            'DataPage',
            'DataTables',
            'Dialogs',
            'Display',
            'Dropdown',
            'Filter',
            'Notifications',
            'ObjectContentEditor',
            'ObjectNavigationalBar',
            'PivotViewer',
            'SchemaEditor',
            'TimeMachine',
            'Toolbar',
            'Types',
        ];
        for (const namespace of forbiddenNamespaces) {
            Object.keys(RootBarrel).should.not.include(namespace);
        }
    });
});

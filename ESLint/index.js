import { createRequire } from 'node:module';
import { noPrimereactDialog } from './lib/noPrimereactDialog.js';
import { noRootBarrelImport } from './lib/noRootBarrelImport.js';
import { onbeforeexecuteMustReturn } from './lib/onbeforeexecuteMustReturn.js';
import { noHooksInViewModel } from './lib/noHooksInViewModel.js';
import { noRawCommandFormMarker } from './lib/noRawCommandFormMarker.js';

const { version } = createRequire(import.meta.url)('./package.json');

// A single flat-config plugin object — meta + rules + self-referencing configs — per the
// ESLint flat-config plugin convention. The default export IS the plugin, so consumers
// get `components.meta`, `components.rules`, and `components.configs` directly. Composes
// on top of @cratis/eslint-config.
const plugin = {
    meta: { name: '@cratis/eslint-plugin-components', version },
    rules: {
        'no-primereact-dialog': noPrimereactDialog,
        'no-root-barrel-import': noRootBarrelImport,
        'onbeforeexecute-must-return': onbeforeexecuteMustReturn,
        'no-hooks-in-view-model': noHooksInViewModel,
        'no-raw-command-form-marker': noRawCommandFormMarker,
    },
    configs: {},
};

// configs reference the plugin itself, so they are assigned after it exists.
//
//   import cratis from '@cratis/eslint-config';
//   import components from '@cratis/eslint-plugin-components';
//   export default [...cratis.configs.consumer, ...components.configs.recommended];
Object.assign(plugin.configs, {
    recommended: [
        {
            name: '@cratis/components/recommended',
            files: ['**/*.ts', '**/*.tsx'],
            plugins: { '@cratis/components': plugin },
            rules: {
                '@cratis/components/no-primereact-dialog': 'error',
                '@cratis/components/no-root-barrel-import': 'error',
                '@cratis/components/onbeforeexecute-must-return': 'error',
                '@cratis/components/no-hooks-in-view-model': 'error',
                '@cratis/components/no-raw-command-form-marker': 'error',
            },
        },
    ],
});

export default plugin;
export const { configs, rules, meta } = plugin;
export { noPrimereactDialog, noRootBarrelImport, onbeforeexecuteMustReturn, noHooksInViewModel, noRawCommandFormMarker };

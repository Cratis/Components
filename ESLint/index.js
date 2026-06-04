import { createRequire } from 'node:module';
import { noPrimereactDialog } from './lib/noPrimereactDialog.js';
import { noRootBarrelImport } from './lib/noRootBarrelImport.js';

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
            },
        },
    ],
});

export default plugin;
export const { configs, rules, meta } = plugin;
export { noPrimereactDialog, noRootBarrelImport };

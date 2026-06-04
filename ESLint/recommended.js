import { noPrimereactDialog } from './lib/noPrimereactDialog.js';
import { noRootBarrelImport } from './lib/noRootBarrelImport.js';

export const plugin = {
    meta: { name: '@cratis/components.eslint' },
    rules: {
        'no-primereact-dialog': noPrimereactDialog,
        'no-root-barrel-import': noRootBarrelImport,
    },
};

// Cratis Components import-surface rules. Compose AFTER the Cratis base
// (`@cratis/eslint-config`) in a consuming project:
//
//   import cratis from '@cratis/eslint-config';
//   import components from '@cratis/components.eslint';
//   export default [...cratis.configs.consumer, ...components.configs.recommended];
const recommended = [
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: { '@cratis/components': plugin },
        rules: {
            '@cratis/components/no-primereact-dialog': 'error',
            '@cratis/components/no-root-barrel-import': 'error',
        },
    },
];

export default recommended;

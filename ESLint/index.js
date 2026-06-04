import recommended, { plugin } from './recommended.js';
import { noPrimereactDialog } from './lib/noPrimereactDialog.js';
import { noRootBarrelImport } from './lib/noRootBarrelImport.js';

// Cratis Components ESLint rules. Composes on top of @cratis/eslint-config.
//
//   configs.recommended  no primereact dialogs + no root-barrel imports
//   rules                the rule implementations, for custom wiring
export const configs = { recommended };
export const rules = {
    'no-primereact-dialog': noPrimereactDialog,
    'no-root-barrel-import': noRootBarrelImport,
};

export { plugin, noPrimereactDialog, noRootBarrelImport };

export default { configs, rules, plugin };

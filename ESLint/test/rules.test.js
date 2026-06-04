import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import { noPrimereactDialog } from '../lib/noPrimereactDialog.js';
import { noRootBarrelImport } from '../lib/noRootBarrelImport.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

ruleTester.run('no-root-barrel-import', noRootBarrelImport, {
    valid: [
        "import { CommandDialog } from '@cratis/components/CommandDialog';",
        "import { DataPage } from '@cratis/components/DataPage';",
        "import { useState } from 'react';",
        "export { Toolbar } from '@cratis/components/Toolbar';",
        // Not the same package — a longer name that merely starts the same.
        "import x from '@cratis/components-extra';",
    ],
    invalid: [
        {
            code: "import { Button } from '@cratis/components';",
            errors: [{ messageId: 'useSubpath', data: { packageName: '@cratis/components' } }],
        },
        {
            code: "export { Button } from '@cratis/components';",
            errors: [{ messageId: 'useSubpath' }],
        },
        {
            code: "export * from '@cratis/components';",
            errors: [{ messageId: 'useSubpath' }],
        },
        {
            // Configurable package name.
            code: "import x from '@acme/ui';",
            options: [{ packageName: '@acme/ui' }],
            errors: [{ messageId: 'useSubpath', data: { packageName: '@acme/ui' } }],
        },
    ],
});

ruleTester.run('no-primereact-dialog', noPrimereactDialog, {
    valid: [
        "import { CommandDialog } from '@cratis/components/CommandDialog';",
        "import { Dialog } from '@cratis/components/Dialogs';",
        "import { Button } from 'primereact/button';",
    ],
    invalid: [
        {
            code: "import { Dialog } from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper', data: { source: 'primereact/dialog' } }],
        },
        {
            code: "import Dialog from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper' }],
        },
        {
            code: "export { Dialog } from 'primereact/dialog';",
            errors: [{ messageId: 'useWrapper' }],
        },
    ],
});

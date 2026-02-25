// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { BusyIndicatorDialogRequest } from '@cratis/arc.react/dialogs';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from './Dialog';

export const BusyIndicatorDialog = (props: BusyIndicatorDialogRequest) => {
    return (
        <Dialog 
            title={props.title} 
            visible={true} 
            onCancel={() => undefined}
            buttons={null}
        >
            <div className="flex flex-col items-center justify-center gap-4 py-4">
                <ProgressSpinner />
                <p className="m-0 text-center">
                    {props.message}
                </p>
            </div>
        </Dialog>
    );
};

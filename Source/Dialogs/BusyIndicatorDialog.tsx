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
            <ProgressSpinner />
            <p className="m-0">
                {props.message}
            </p>
        </Dialog>
    );
};

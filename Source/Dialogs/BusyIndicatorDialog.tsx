import { Dialog } from 'primereact/dialog';
import { BusyIndicatorDialogRequest } from '@cratis/arc.react/dialogs';
import { ProgressSpinner } from 'primereact/progressspinner';

export const BusyIndicatorDialog = (props: BusyIndicatorDialogRequest) => {

    const headerElement = (
        <div className="inline-flex align-items-center justify-content-center gap-2">
            <span className="font-bold white-space-nowrap">{props.title}</span>
        </div>
    );

    return (
        <>
            <Dialog header={headerElement} modal visible={true} onHide={() => { }}>
                <ProgressSpinner />
                <p className="m-0">
                    {props.message}
                </p>
            </Dialog>
        </>
    );
};

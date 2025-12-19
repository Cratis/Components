export interface FormElementProps {
    children: React.ReactNode;
    icon: React.ReactNode;
}

export const FormElement = (props: FormElementProps) => {
    return (
        <div className="card flex flex-column md:flex-row gap-3">
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">
                    {props.icon}
                </span>
                {props.children}
            </div>
        </div>
    )
}

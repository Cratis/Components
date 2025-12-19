import { HTMLAttributes, ReactNode } from 'react';

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    children?: ReactNode;
    panel?: boolean
}

export const Page = ({ title, children, panel, ...rest }: PageProps) => {
    return (
        <div className='flex flex-col h-full' {...rest}>
            <h1 className='text-3xl mt-3 mb-4'>{title}</h1>
            <main className={`overflow-hidden h-full flex flex-col flex-1 ${panel ? 'panel' : ''}`}>
                {children}
            </main>
        </div>
    );
};

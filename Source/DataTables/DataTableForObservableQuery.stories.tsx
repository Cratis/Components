// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DataTableForObservableQuery } from './DataTableForObservableQuery';
import { Column } from 'primereact/column';
import { ObservableQueryFor } from '@cratis/arc/queries';
import { DataTableSelectionSingleChangeEvent } from 'primereact/datatable';

const meta: Meta<typeof DataTableForObservableQuery> = {
    title: 'DataTables/DataTableForObservableQuery',
    component: DataTableForObservableQuery,
};

export default meta;
type Story = StoryObj<typeof DataTableForObservableQuery>;

// Mock data type
interface Task {
    id: number;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assignee: string;
}

// Mock observable query
class TasksQuery extends ObservableQueryFor<Task, object> {
    readonly route = '/api/tasks';
    readonly routeTemplate = '/api/tasks';
    readonly defaultValue: Task[] = [
        { id: 1, title: 'Implement login feature', status: 'in-progress', priority: 'high', assignee: 'Alice' },
        { id: 2, title: 'Fix navigation bug', status: 'todo', priority: 'medium', assignee: 'Bob' },
        { id: 3, title: 'Update documentation', status: 'done', priority: 'low', assignee: 'Charlie' },
        { id: 4, title: 'Code review PR #123', status: 'todo', priority: 'high', assignee: 'Alice' },
        { id: 5, title: 'Refactor user service', status: 'in-progress', priority: 'medium', assignee: 'Bob' },
        { id: 6, title: 'Write unit tests', status: 'todo', priority: 'high', assignee: 'Charlie' },
        { id: 7, title: 'Deploy to staging', status: 'done', priority: 'high', assignee: 'Alice' },
        { id: 8, title: 'Update dependencies', status: 'todo', priority: 'low', assignee: 'Bob' },
    ];
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'done':
            return 'text-green-600';
        case 'in-progress':
            return 'text-blue-600';
        case 'todo':
            return 'text-gray-600';
        default:
            return '';
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high':
            return 'text-red-600 font-bold';
        case 'medium':
            return 'text-orange-600';
        case 'low':
            return 'text-gray-600';
        default:
            return '';
    }
};

export const Default: Story = {
    render: () => (
        <div className="p-4">
            <DataTableForObservableQuery<TasksQuery, Task, object>
                query={TasksQuery}
                emptyMessage="No tasks found"
                dataKey="id"
            >
                <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                <Column field="title" header="Task Title" sortable style={{ width: '35%' }} />
                <Column 
                    field="status" 
                    header="Status" 
                    sortable 
                    style={{ width: '20%' }}
                    body={(rowData: Task) => (
                        <span className={getStatusColor(rowData.status)}>
                            {rowData.status}
                        </span>
                    )}
                />
                <Column 
                    field="priority" 
                    header="Priority" 
                    sortable 
                    style={{ width: '15%' }}
                    body={(rowData: Task) => (
                        <span className={getPriorityColor(rowData.priority)}>
                            {rowData.priority}
                        </span>
                    )}
                />
                <Column field="assignee" header="Assignee" sortable style={{ width: '20%' }} />
            </DataTableForObservableQuery>
        </div>
    )
};

export const WithSelection: Story = {
    render: () => {
        const [selectedTask, setSelectedTask] = useState<Task | undefined>();

        return (
            <div className="p-4">
                <DataTableForObservableQuery<TasksQuery, Task, object>
                    query={TasksQuery}
                    emptyMessage="No tasks found"
                    dataKey="id"
                    selection={selectedTask}
                    onSelectionChange={(e: DataTableSelectionSingleChangeEvent<Task[]>) => setSelectedTask(e.value as Task)}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                    <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                    <Column field="title" header="Task Title" sortable style={{ width: '35%' }} />
                    <Column 
                        field="status" 
                        header="Status" 
                        sortable 
                        style={{ width: '20%' }}
                        body={(rowData: Task) => (
                            <span className={getStatusColor(rowData.status)}>
                                {rowData.status}
                            </span>
                        )}
                    />
                    <Column field="assignee" header="Assignee" sortable style={{ width: '20%' }} />
                </DataTableForObservableQuery>
                
                {selectedTask && (
                    <div className="mt-4 p-4 border rounded">
                        <h3 className="font-bold mb-2">Selected Task:</h3>
                        <p><strong>Title:</strong> {selectedTask.title}</p>
                        <p><strong>Status:</strong> {selectedTask.status}</p>
                        <p><strong>Priority:</strong> {selectedTask.priority}</p>
                        <p><strong>Assignee:</strong> {selectedTask.assignee}</p>
                    </div>
                )}
            </div>
        );
    }
};

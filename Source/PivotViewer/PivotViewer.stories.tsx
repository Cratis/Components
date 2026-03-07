// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { PivotViewer } from './PivotViewer';

// ---------------------------------------------------------------------------
// Large-dataset generator
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah',
    'Isaac', 'Julia', 'Kevin', 'Laura', 'Michael', 'Natalie', 'Oliver', 'Penelope',
    'Quinn', 'Rachel', 'Samuel', 'Tara', 'Ursula', 'Victor', 'Wendy', 'Xavier',
    'Yvonne', 'Zachary', 'Amelia', 'Benjamin', 'Clara', 'Daniel', 'Eleanor', 'Frank',
    'Grace', 'Henry', 'Iris', 'James', 'Katherine', 'Leo', 'Mia', 'Noah',
];

const LAST_NAMES = [
    'Johnson', 'Smith', 'Brown', 'Prince', 'Norton', 'Lee', 'Miller', 'Davis',
    'Newton', 'Taylor', 'Anderson', 'Wilson', 'Moore', 'Jackson', 'Martin', 'White',
    'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Walker',
    'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker',
    'Adams', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips',
];

const DEPARTMENTS = [
    'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
    'Finance', 'Human Resources', 'Legal', 'Operations', 'Support',
    'Research', 'Data Science', 'Security', 'Infrastructure', 'Customer Success',
];

const OFFICES = [
    'Seattle', 'San Francisco', 'Austin', 'New York', 'Boston',
    'Chicago', 'Denver', 'Los Angeles', 'Atlanta', 'London',
    'Berlin', 'Amsterdam', 'Singapore', 'Tokyo', 'Sydney',
];

const SENIORITY_LEVELS = ['Intern', 'Junior', 'Mid-level', 'Senior', 'Staff', 'Principal', 'Director', 'VP'];

const EMPLOYMENT_STATUSES = ['Active', 'On Leave', 'Contractor', 'Part-time'];

const SKILL_TAGS = [
    'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'React', 'Node.js',
    'Kubernetes', 'AWS', 'Azure', 'GCP', 'ML/AI', 'Data Engineering', 'Security',
    'Product Management', 'UX Design', 'DevOps', 'Agile', 'Communication',
];

function seededRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)];
}

interface Employee {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    age: number;
    department: string;
    office: string;
    seniority: string;
    status: string;
    salary: number;
    yearsAtCompany: number;
    skills: string[];
    primarySkill: string;
}

function generateEmployees(count: number): Employee[] {
    const rng = seededRng(42);
    const employees: Employee[] = [];

    for (let i = 0; i < count; i++) {
        const firstName = pick(rng, FIRST_NAMES);
        const lastName = pick(rng, LAST_NAMES);
        const seniority = pick(rng, SENIORITY_LEVELS);
        const seniorityIndex = SENIORITY_LEVELS.indexOf(seniority);

        const age = 22 + Math.floor(rng() * 40);
        const yearsAtCompany = Math.floor(rng() * Math.min(age - 20, 20));
        const baseSalary = 60_000 + seniorityIndex * 25_000 + Math.floor(rng() * 30_000);

        const numSkills = 1 + Math.floor(rng() * 4);
        const shuffled = [...SKILL_TAGS].sort(() => rng() - 0.5);
        const skills = shuffled.slice(0, numSkills);

        employees.push({
            id: i + 1,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            age,
            department: pick(rng, DEPARTMENTS),
            office: pick(rng, OFFICES),
            seniority,
            status: pick(rng, EMPLOYMENT_STATUSES),
            salary: baseSalary,
            yearsAtCompany,
            skills,
            primarySkill: skills[0],
        });
    }

    return employees;
}

const largeDataset = generateEmployees(2_500);

const meta: Meta<typeof PivotViewer> = {
    title: 'PivotViewer/PivotViewer',
    component: PivotViewer,
};

export default meta;
type Story = StoryObj<typeof PivotViewer>;

// Sample data types for demonstration
interface Address {
    street: string;
    city: string;
    zipCode: string;
}

interface Person {
    id: number;
    name: string;
    age: number;
    department: string;
    address: Address;
}

const sampleData: Person[] = [
    { id: 1, name: 'Alice Johnson', age: 28, department: 'Engineering', address: { street: '123 Main St', city: 'Seattle', zipCode: '98101' } },
    { id: 2, name: 'Bob Smith', age: 35, department: 'Marketing', address: { street: '456 Oak Ave', city: 'Portland', zipCode: '97201' } },
    { id: 3, name: 'Charlie Brown', age: 42, department: 'Engineering', address: { street: '789 Pine Rd', city: 'Seattle', zipCode: '98102' } },
    { id: 4, name: 'Diana Prince', age: 31, department: 'Sales', address: { street: '321 Elm St', city: 'San Francisco', zipCode: '94102' } },
    { id: 5, name: 'Edward Norton', age: 29, department: 'Engineering', address: { street: '654 Maple Dr', city: 'Portland', zipCode: '97202' } },
    { id: 6, name: 'Fiona Lee', age: 33, department: 'Human Resources', address: { street: '852 Cedar St', city: 'Seattle', zipCode: '98103' } },
    { id: 7, name: 'George Miller', age: 27, department: 'Support', address: { street: '147 Birch Ln', city: 'Portland', zipCode: '97204' } },
    { id: 8, name: 'Hannah Davis', age: 45, department: 'Finance', address: { street: '963 Walnut Ave', city: 'San Francisco', zipCode: '94103' } },
    { id: 9, name: 'Isaac Newton', age: 38, department: 'Research', address: { street: '753 Spruce Rd', city: 'Austin', zipCode: '73301' } },
];

export const Default: Story = {
    render: () => {
        const dimensions = [
            {
                key: 'department',
                label: 'Department',
                getValue: (item: Person) => item.department,
            },
            {
                key: 'city',
                label: 'City',
                getValue: (item: Person) => item.address.city,
            },
        ];
        
        const filters = [
            {
                key: 'age',
                label: 'Age',
                getValue: (item: Person) => item.age,
                type: 'number' as const,
            },
        ];
        
        return (
            <div className="storybook-wrapper" style={{ height: 'calc(100vh - 2rem)', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                <PivotViewer<Person>
                    data={sampleData}
                    dimensions={dimensions}
                    filters={filters}
                    // Type-safe search fields with support for nested properties
                    searchFields={[
                        (item) => item.name,
                        (item) => item.department,
                        (item) => item.address.city,
                        (item) => item.address.street,
                    ]}
                    cardRenderer={(item) => ({
                        title: item.name,
                        labels: ['Id', 'Age', 'Department', 'City'],
                        values: [String(item.id),String(item.age), item.department, item.address.city],
                    })}
                    // Example: override a couple of theme variables
                    colors={{
                        primaryColor: '#91BDF8',
                        primary500: '#2E66BA',
                    }}
                    // Example: custom content inside the built-in detail drawer
                    detailRenderer={(item, onClose) => (
                        <section>
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                                    <p style={{ margin: 0, opacity: 0.8 }}>Department • {item.department}</p>
                                </div>
                                <button type="button" onClick={onClose} title="Close" className="p-button p-button-text">
                                    Close
                                </button>
                            </header>
                            <dl style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 0.75rem' }}>
                                <div>
                                    <dt>Age</dt>
                                    <dd>{item.age}</dd>
                                </div>
                                <div>
                                    <dt>City</dt>
                                    <dd>{item.address.city}</dd>
                                </div>
                                <div>
                                    <dt>Street</dt>
                                    <dd>{item.address.street}</dd>
                                </div>
                            </dl>
                        </section>
                    )}
                    getItemId={(item) => item.id}
                />
            </div>
        );
    },
};

export const LargeDataset: Story = {
    name: 'Large Dataset (2 500 employees)',
    render: () => {
        const dimensions = [
            {
                key: 'department',
                label: 'Department',
                getValue: (item: Employee) => item.department,
            },
            {
                key: 'office',
                label: 'Office',
                getValue: (item: Employee) => item.office,
            },
            {
                key: 'seniority',
                label: 'Seniority',
                getValue: (item: Employee) => item.seniority,
            },
            {
                key: 'status',
                label: 'Status',
                getValue: (item: Employee) => item.status,
            },
            {
                key: 'primarySkill',
                label: 'Primary Skill',
                getValue: (item: Employee) => item.primarySkill,
            },
        ];

        const filters = [
            {
                key: 'department',
                label: 'Department',
                getValue: (item: Employee) => item.department,
                multi: true,
            },
            {
                key: 'office',
                label: 'Office',
                getValue: (item: Employee) => item.office,
                multi: true,
            },
            {
                key: 'seniority',
                label: 'Seniority',
                getValue: (item: Employee) => item.seniority,
                multi: true,
            },
            {
                key: 'status',
                label: 'Status',
                getValue: (item: Employee) => item.status,
                multi: true,
            },
            {
                key: 'salary',
                label: 'Salary',
                getValue: (item: Employee) => item.salary,
                type: 'number' as const,
                buckets: 20,
            },
            {
                key: 'age',
                label: 'Age',
                getValue: (item: Employee) => item.age,
                type: 'number' as const,
            },
            {
                key: 'yearsAtCompany',
                label: 'Years at Company',
                getValue: (item: Employee) => item.yearsAtCompany,
                type: 'number' as const,
            },
        ];

        return (
            <div
                className="storybook-wrapper"
                style={{
                    height: 'calc(100vh - 2rem)',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    alignItems: 'stretch',
                }}
            >
                <PivotViewer<Employee>
                    data={largeDataset}
                    dimensions={dimensions}
                    filters={filters}
                    defaultDimensionKey="department"
                    searchFields={[
                        (item) => item.name,
                        (item) => item.department,
                        (item) => item.office,
                        (item) => item.seniority,
                        (item) => item.primarySkill,
                    ]}
                    cardRenderer={(item) => ({
                        title: item.name,
                        labels: ['Dept', 'Office', 'Seniority', 'Salary'],
                        values: [
                            item.department,
                            item.office,
                            item.seniority,
                            `$${item.salary.toLocaleString()}`,
                        ],
                    })}
                    detailRenderer={(item, onClose) => (
                        <section>
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                                    <p style={{ margin: 0, opacity: 0.7 }}>{item.seniority} · {item.department}</p>
                                </div>
                                <button type="button" onClick={onClose} title="Close" className="p-button p-button-text">
                                    Close
                                </button>
                            </header>
                            <dl style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 0.75rem' }}>
                                <dt>Office</dt><dd>{item.office}</dd>
                                <dt>Age</dt><dd>{item.age}</dd>
                                <dt>Status</dt><dd>{item.status}</dd>
                                <dt>Salary</dt><dd>${item.salary.toLocaleString()}</dd>
                                <dt>Tenure</dt><dd>{item.yearsAtCompany} yr{item.yearsAtCompany !== 1 ? 's' : ''}</dd>
                                <dt>Skills</dt><dd>{item.skills.join(', ')}</dd>
                            </dl>
                        </section>
                    )}
                    getItemId={(item) => item.id}
                    colors={{
                        primaryColor: '#91BDF8',
                        primary500: '#2E66BA',
                    }}
                />
            </div>
        );
    },
};
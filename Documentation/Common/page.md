# Page

Layout component for creating consistent page structures.

## Purpose

The Page component provides a consistent layout structure with a title and content area.

## Key Features

- Consistent page header styling
- Flexible content area
- Optional panel styling
- Responsive layout
- Tailwind CSS integration

## Basic Usage

```typescript
import { Page } from '@cratis/components';

function MyPage() {
    return (
        <Page title="My Page">
            <div>Page content goes here</div>
        </Page>
    );
}
```

## With Panel Styling

```typescript
<Page title="Dashboard" panel={true}>
    <div>Content with panel background</div>
</Page>
```

## Props

- `title`: Page title displayed at the top
- `panel`: Apply panel styling to content area (default: false)
- `children`: Page content
- All standard HTML div attributes (className, style, etc.)

## Layout

The Page component uses Flexbox for layout:

- Full height container
- Large heading (h1) at the top
- Flexible content area that fills remaining space
- Overflow handling for scrollable content

## Examples

### Simple Page

```typescript
<Page title="Users">
    <UserList />
</Page>
```

### Page with Multiple Sections

```typescript
<Page title="Dashboard" panel>
    <div className="grid grid-cols-3 gap-4">
        <StatCard title="Users" value={totalUsers} />
        <StatCard title="Orders" value={totalOrders} />
        <StatCard title="Revenue" value={totalRevenue} />
    </div>
    
    <div className="mt-4">
        <RecentActivity />
    </div>
</Page>
```

### Page with Custom Styling

```typescript
<Page 
    title="Reports" 
    className="custom-page"
    style={{ backgroundColor: '#f5f5f5' }}
>
    <ReportViewer />
</Page>
```

## Integration

Works with:

- Tailwind CSS for styling
- React Router for navigation
- Any content components

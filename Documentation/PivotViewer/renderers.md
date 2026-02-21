# PivotViewer - Renderers

## Card Renderer

The card renderer determines how each item appears in the collection view.

### Basic Card

```typescript
const cardRenderer = (item: Product) => (
    <div className="product-card">
        <img src={item.imageUrl} alt={item.name} />
        <h3>{item.name}</h3>
        <p className="price">${item.price}</p>
    </div>
);
```

### Rich Card Example

```typescript
const taskCardRenderer = (item: Task) => (
    <div className="task-card">
        <div className="task-header">
            <span className={`priority priority-${item.priority}`}>
                P{item.priority}
            </span>
            <span className={`status status-${item.status}`}>
                {item.status}
            </span>
        </div>
        
        <h4 className="task-title">{item.title}</h4>
        
        <div className="task-meta">
            <div className="assignee">
                <img src={item.assigneeAvatar} alt={item.assignee} className="avatar" />
                <span>{item.assignee}</span>
            </div>
            
            <div className="tags">
                {item.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                ))}
            </div>
        </div>
        
        <div className="task-footer">
            <span className="estimate">{item.estimatedHours}h</span>
            <span className="due-date">{formatDate(item.dueDate)}</span>
        </div>
    </div>
);
```

## Detail Renderer

The detail renderer shows expanded information when an item is selected.

### Basic Details

```typescript
const detailRenderer = (item: Product) => (
    <div className="product-details">
        <h2>{item.name}</h2>
        <img src={item.imageUrl} alt={item.name} className="detail-image" />
        <p className="description">{item.description}</p>
        <div className="specs">
            <p><strong>SKU:</strong> {item.sku}</p>
            <p><strong>Price:</strong> ${item.price}</p>
            <p><strong>Stock:</strong> {item.stock} units</p>
        </div>
    </div>
);
```

### Comprehensive Details

```typescript
const taskDetailRenderer = (item: Task) => (
    <div className="task-details">
        <div className="detail-header">
            <h2>{item.title}</h2>
            <div className="header-badges">
                <span className={`priority-badge p-${item.priority}`}>
                    Priority {item.priority}
                </span>
                <span className={`status-badge status-${item.status}`}>
                    {item.status}
                </span>
            </div>
        </div>
        
        <div className="detail-section">
            <h3>Description</h3>
            <p>{item.description}</p>
        </div>
        
        <div className="detail-section">
            <h3>Assignment</h3>
            <div className="assignee-info">
                <img src={item.assigneeAvatar} alt={item.assignee} />
                <div>
                    <strong>{item.assignee}</strong>
                    <p>{item.assigneeEmail}</p>
                </div>
            </div>
        </div>
        
        <div className="detail-section">
            <h3>Timeline</h3>
            <div className="timeline">
                <p><strong>Created:</strong> {formatDate(item.createdAt)}</p>
                <p><strong>Due:</strong> {formatDate(item.dueDate)}</p>
                <p><strong>Estimated:</strong> {item.estimatedHours} hours</p>
            </div>
        </div>
        
        <div className="detail-section">
            <h3>Tags</h3>
            <div className="tags-list">
                {item.tags.map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                ))}
            </div>
        </div>
        
        {item.attachments && item.attachments.length > 0 && (
            <div className="detail-section">
                <h3>Attachments</h3>
                <ul className="attachments-list">
                    {item.attachments.map(att => (
                        <li key={att.id}>
                            <a href={att.url}>{att.name}</a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);
```

## Interactive Details

Add interactive elements to the detail panel:

```typescript
const interactiveDetailRenderer = (item: Task) => {
    const [editing, setEditing] = useState(false);
    const [notes, setNotes] = useState(item.notes);
    
    const handleSaveNotes = async () => {
        await updateTask(item.id, { notes });
        setEditing(false);
    };
    
    return (
        <div className="task-details-interactive">
            <h2>{item.title}</h2>
            
            {/* ... other sections ... */}
            
            <div className="detail-section">
                <div className="section-header">
                    <h3>Notes</h3>
                    <button onClick={() => setEditing(!editing)}>
                        {editing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                
                {editing ? (
                    <div>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={5}
                        />
                        <button onClick={handleSaveNotes}>Save</button>
                    </div>
                ) : (
                    <p>{notes || 'No notes'}</p>
                )}
            </div>
            
            <div className="detail-actions">
                <button onClick={() => handleStatusChange(item.id)}>
                    Change Status
                </button>
                <button onClick={() => handleReassign(item.id)}>
                    Reassign
                </button>
                <button onClick={() => handleDelete(item.id)}>
                    Delete
                </button>
            </div>
        </div>
    );
};
```

## Conditional Rendering

Adapt cards based on item properties:

```typescript
const adaptiveCardRenderer = (item: Task) => {
    const isOverdue = new Date(item.dueDate) < new Date();
    const isHighPriority = item.priority >= 8;
    
    return (
        <div className={`task-card ${isOverdue ? 'overdue' : ''} ${isHighPriority ? 'high-priority' : ''}`}>
            {isOverdue && (
                <div className="overdue-badge">Overdue</div>
            )}
            
            {isHighPriority && (
                <div className="urgent-indicator">!</div>
            )}
            
            <h4>{item.title}</h4>
            
            {/* ... rest of card ... */}
        </div>
    );
};
```

## Best Practices

### Cards

1. **Keep cards compact**: Display essential info only
2. **Use visual hierarchy**: Most important info should stand out
3. **Consistent sizing**: All cards should be similar size
4. **Show preview**: Give enough context to identify items
5. **Use icons and colors**: Visual cues help quick scanning
6. **Limit text**: Truncate long content with ellipsis
7. **Include imagery**: Photos/icons make cards more scannable

### Details

1. **Show comprehensive info**: This is the place for all details
2. **Organize in sections**: Group related information
3. **Make it actionable**: Include relevant actions/buttons
4. **Load related data**: Fetch additional details as needed
5. **Use tabs for complex data**: Don't overwhelm with single view
6. **Show relationships**: Link to related items
7. **Include metadata**: Timestamps, IDs, version info
8. **Consider mobile**: Ensure details work on small screens

# Real-Time Notification Flow Diagram

## Complete Flow: Create Data with Notification

```
┌─────────────┐
│   User/UI   │
└──────┬──────┘
       │
       │ POST /api/data
       ↓
┌──────────────────────┐
│  Data Controller     │
│  1. Validate         │
│  2. Create Data      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Get Socket Service  │
│  (if available)      │
└──────┬───────────────┘
       │
       ↓
┌────────────────────────────────┐
│  Socket Service                │
│                                │
│  ├─ Send Notification          │
│  │  (to user)                  │
│  │                             │
│  └─ Broadcast Update           │
│     (to subscribers)           │
└────────┬───────────────────────┘
         │
    ┌────┴────┐
    │         │
    ↓         ↓
┌─────────┐ ┌──────────────┐
│ User's  │ │ All Sockets  │
│ Socket  │ │ in 'data:*'  │
└────┬────┘ └──────┬───────┘
     │             │
     ↓             ↓
┌─────────────────────────┐
│  Frontend UI            │
│  - Toast Notification   │
│  - Real-time Update     │
└─────────────────────────┘
```

## Event Types

### Personal Notification

```
notification event → Specific user
{
  type: 'success',
  message: 'New data created',
  data: { id, name, type }
}
```

### Broadcast Update

```
data:updated event → All subscribers
{
  entity: 'data',
  data: { /* full object */ },
  timestamp: '2025-01-04T...'
}
```

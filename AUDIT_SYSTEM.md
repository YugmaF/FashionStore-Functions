# User Audit System Documentation

## Overview
A comprehensive audit logging system has been added to track all user activities including authentication, profile changes, cart operations, and order placements.

## Features
- Automatic logging of user actions
- IP address and user agent tracking
- Detailed metadata for each action
- Success/failure status tracking
- Pagination and filtering support
- Admin and user-specific access controls

## Audit Actions Tracked

### Authentication Events
- `SIGNUP` - New user registration
- `LOGIN` - Successful login
- `LOGOUT` - User logout
- `LOGIN_FAILED` - Failed login attempts

### Password Events
- `PASSWORD_RESET_REQUEST` - Forgot password email sent
- `PASSWORD_RESET_COMPLETE` - Password reset via link
- `PASSWORD_CHANGE` - Admin-initiated password reset

### Profile Events
- `PROFILE_UPDATE` - User profile information changes
- `STATE_CHANGE` - Account state changes (active/inactive)

### Shopping Events
- `CART_ADD` - Product added to cart
- `CART_REMOVE` - Product removed from cart
- `WISHLIST_ADD` - Product added to wishlist
- `WISHLIST_REMOVE` - Product removed from wishlist
- `ORDER_PLACED` - Order successfully placed

## API Endpoints

### 1. Get User Audit Logs
**Endpoint:** `GET /api/audit/user/:userId`

**Authentication:** Required (user can view own logs, admins can view any user)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `action` (optional) - Filter by specific action type

**Example Request:**
```bash
GET /api/audit/user/507f1f77bcf86cd799439011?page=1&limit=20&action=LOGIN
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "logs": [
    {
      "_id": "507f191e810c19729de860ea",
      "userId": "507f1f77bcf86cd799439011",
      "userEmail": "user@example.com",
      "action": "LOGIN",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {
        "role": "0"
      },
      "status": "SUCCESS",
      "createdAt": "2026-07-26T10:30:00.000Z",
      "updatedAt": "2026-07-26T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Get All Audit Logs (Admin Only)
**Endpoint:** `GET /api/audit/logs`

**Authentication:** Required (Admin only)

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50) - Items per page
- `action` (optional) - Filter by action type
- `status` (optional) - Filter by SUCCESS/FAILURE
- `userId` (optional) - Filter by user ID
- `userEmail` (optional) - Search by email (case-insensitive)
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)

**Example Request:**
```bash
GET /api/audit/logs?page=1&limit=50&action=LOGIN_FAILED&startDate=2026-07-01&endDate=2026-07-26
Authorization: Bearer <admin_token>
```

### 3. Get Audit Statistics (Admin Only)
**Endpoint:** `GET /api/audit/stats`

**Authentication:** Required (Admin only)

**Example Response:**
```json
{
  "actionStats": [
    {
      "_id": "LOGIN",
      "count": 1523
    },
    {
      "_id": "PROFILE_UPDATE",
      "count": 456
    }
  ],
  "statusStats": [
    {
      "_id": "SUCCESS",
      "count": 8934
    },
    {
      "_id": "FAILURE",
      "count": 123
    }
  ]
}
```

## Database Schema

### UserAudit Collection
```javascript
{
  userId: ObjectId,          // Reference to User
  userEmail: String,         // Email (preserved even if user deleted)
  action: String,            // Action type (enum)
  ipAddress: String,         // IP address of request
  userAgent: String,         // Browser/device information
  metadata: Mixed,           // Action-specific data
  status: String,            // SUCCESS or FAILURE
  errorMessage: String,      // Error details (if failed)
  createdAt: Date,          // Auto-generated timestamp
  updatedAt: Date           // Auto-generated timestamp
}
```

### Indexes
- `{userId: 1, createdAt: -1}` - Fast user-specific queries
- `{action: 1, createdAt: -1}` - Fast action-specific queries
- `{createdAt: -1}` - Fast time-based queries

## Security Considerations

1. **Access Control**
   - Users can only view their own audit logs
   - Admins (role "1") can view all audit logs
   - All endpoints require authentication

2. **Data Privacy**
   - Passwords are never stored in audit logs
   - Only field names are logged, not sensitive values
   - IP addresses and user agents are captured for security analysis

3. **Non-blocking**
   - Audit logging failures don't break main operations
   - Errors are logged to console but don't propagate

4. **Performance**
   - Indexed fields for efficient querying
   - Pagination prevents large data transfers
   - Async logging doesn't block responses

## Usage Examples

### Testing Audit Logs

1. **Create a new user (signup):**
```bash
POST /api/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

2. **Login and check audit logs:**
```bash
POST /api/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}
```

3. **View your audit logs:**
```bash
GET /api/audit/user/<your_user_id>
Authorization: Bearer <your_token>
```

4. **As admin, view all failed login attempts:**
```bash
GET /api/audit/logs?action=LOGIN_FAILED&status=FAILURE
Authorization: Bearer <admin_token>
```

## Metadata Examples

### LOGIN
```json
{
  "role": "0"  // User role at login time
}
```

### PROFILE_UPDATE
```json
{
  "updatedFields": ["name", "email", "address"]
}
```

### PASSWORD_CHANGE
```json
{
  "resetBy": "507f1f77bcf86cd799439011",  // Admin who reset
  "resetType": "admin-initiated"
}
```

### ORDER_PLACED
```json
{
  "transactionId": "txn_abc123",
  "amount": 99.99,
  "productCount": 3
}
```

### STATE_CHANGE
```json
{
  "newState": "0",  // 0 = inactive, 1 = active
  "changedBy": "507f1f77bcf86cd799439011"  // Admin ID
}
```

## Future Enhancements

Consider adding:
- Data retention policies (auto-delete old logs)
- Export functionality for compliance
- Real-time alerting for suspicious activities
- Detailed IP geolocation tracking
- Session correlation IDs
- Rate limiting based on audit logs

## Troubleshooting

### Logs not appearing
1. Check MongoDB connection is working
2. Verify audit routes are registered in app.js
3. Check console for audit logging errors
4. Ensure UserAudit model is imported correctly

### Permission denied errors
1. Verify JWT token is valid
2. Check user role (admin = "1")
3. Ensure userId in URL matches authenticated user (or user is admin)

### Performance issues
1. Verify indexes are created: `db.useraudits.getIndexes()`
2. Use pagination (don't fetch all logs at once)
3. Add date range filters to limit result sets
4. Consider archiving old audit logs

## Technical Notes

- Audit logging is async and won't block operations
- Failed audit logs are logged to console, not thrown
- IP address extraction handles proxy headers (x-forwarded-for)
- All timestamps are in UTC
- Audit logs are never automatically deleted

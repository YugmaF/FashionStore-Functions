# Testing the User Audit System

## Prerequisites
1. MongoDB running and connected
2. Application started: `node app.js`
3. API testing tool (Postman, curl, or similar)

## Test Scenarios

### Test 1: Verify Audit on Signup
```bash
# Create a new user
curl -X POST http://localhost:8000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "TestPass123"
  }'

# Expected: User created + SIGNUP audit log in database
# Verify in MongoDB:
# db.useraudits.find({action: "SIGNUP"}).sort({createdAt: -1}).limit(1)
```

### Test 2: Verify Audit on Login Success
```bash
# Login with correct credentials
curl -X POST http://localhost:8000/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }'

# Expected: Token returned + LOGIN audit log created
# Save the token for subsequent tests
```

### Test 3: Verify Audit on Login Failure
```bash
# Login with wrong password
curl -X POST http://localhost:8000/api/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }'

# Expected: Error + LOGIN_FAILED audit log with failure status
```

### Test 4: View Your Own Audit Logs
```bash
# Get user ID from login response, then:
curl -X GET "http://localhost:8000/api/audit/user/{userId}?page=1&limit=10" \
  -H "Authorization: Bearer {your_token}"

# Expected: JSON with your audit logs and pagination info
```

### Test 5: Filter Audit Logs by Action
```bash
# Get only LOGIN actions
curl -X GET "http://localhost:8000/api/audit/user/{userId}?action=LOGIN" \
  -H "Authorization: Bearer {your_token}"

# Expected: Only LOGIN audit entries
```

### Test 6: Profile Update Audit
```bash
# Update user profile
curl -X PUT http://localhost:8000/api/user/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "name": "Updated Name"
  }'

# Expected: Profile updated + PROFILE_UPDATE audit log
# Check metadata field should contain: {"updatedFields": ["name"]}
```

### Test 7: Cart Operations Audit
```bash
# Add product to cart (assuming product exists)
curl -X PUT http://localhost:8000/api/user/{userId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "product": "{productId}"
  }'

# Expected: CART_ADD audit log created

# Remove product from cart
curl -X PUT http://localhost:8000/api/user/{userId}/cart/item \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {your_token}" \
  -d '{
    "_id": "{productId}"
  }'

# Expected: CART_REMOVE audit log created
```

### Test 8: Admin View All Logs (Requires Admin Token)
```bash
# Admin login first (with role = "1")
# Then get all audit logs:
curl -X GET "http://localhost:8000/api/audit/logs?page=1&limit=50" \
  -H "Authorization: Bearer {admin_token}"

# Expected: All audit logs across all users
```

### Test 9: Filter by Date Range (Admin Only)
```bash
curl -X GET "http://localhost:8000/api/audit/logs?startDate=2026-07-01&endDate=2026-07-31" \
  -H "Authorization: Bearer {admin_token}"

# Expected: Only logs from July 2026
```

### Test 10: Get Audit Statistics (Admin Only)
```bash
curl -X GET http://localhost:8000/api/audit/stats \
  -H "Authorization: Bearer {admin_token}"

# Expected: Aggregated statistics by action and status
```

### Test 11: Logout Audit
```bash
curl -X GET http://localhost:8000/api/signout \
  -H "Authorization: Bearer {your_token}"

# Expected: LOGOUT audit log created
```

## MongoDB Verification Queries

### Check all audit logs
```javascript
db.useraudits.find().sort({createdAt: -1}).limit(10).pretty()
```

### Check specific action type
```javascript
db.useraudits.find({action: "LOGIN"}).sort({createdAt: -1}).limit(5).pretty()
```

### Check failed actions
```javascript
db.useraudits.find({status: "FAILURE"}).sort({createdAt: -1}).pretty()
```

### Check logs for specific user
```javascript
db.useraudits.find({userEmail: "testuser@example.com"}).sort({createdAt: -1}).pretty()
```

### Verify indexes exist
```javascript
db.useraudits.getIndexes()
```

### Count logs by action
```javascript
db.useraudits.aggregate([
  {$group: {_id: "$action", count: {$sum: 1}}},
  {$sort: {count: -1}}
])
```

## Expected Audit Log Structure

```json
{
  "_id": "ObjectId('...')",
  "userId": "ObjectId('...')",
  "userEmail": "testuser@example.com",
  "action": "LOGIN",
  "ipAddress": "::1",
  "userAgent": "PostmanRuntime/7.29.0",
  "metadata": {
    "role": "0"
  },
  "status": "SUCCESS",
  "errorMessage": null,
  "createdAt": "2026-07-26T10:30:00.000Z",
  "updatedAt": "2026-07-26T10:30:00.000Z"
}
```

## Troubleshooting

### No audit logs appearing
1. Check console output: `tail -f logs/app.log` (if logging configured)
2. Check for errors in terminal where app is running
3. Verify MongoDB connection: `mongoose.connection.readyState` should be 1
4. Check UserAudit model loaded: Add `console.log('UserAudit model loaded')` in model file

### "Access denied" errors
1. Ensure you're using a valid JWT token
2. Check token hasn't expired
3. For admin endpoints, verify user role is "1"
4. For user-specific endpoints, verify userId in URL matches token

### Audit logs created but can't retrieve them
1. Verify routes are registered in app.js
2. Check middleware order (requiredSignin must come before isAuth/isAdmin)
3. Verify getUserById middleware is working

## Success Criteria

✅ All user actions create corresponding audit logs  
✅ Audit logs contain IP address and user agent  
✅ Failed actions are logged with FAILURE status  
✅ Users can view their own logs  
✅ Admins can view all logs with filtering  
✅ Pagination works correctly  
✅ Metadata contains relevant action details  
✅ Audit logging doesn't break main operations  
✅ Database indexes exist and improve query performance

## Performance Testing

### Test with 1000+ logs
```javascript
// Create dummy audit logs for testing
for(let i = 0; i < 1000; i++) {
  db.useraudits.insertOne({
    userId: ObjectId("507f1f77bcf86cd799439011"),
    userEmail: "test@example.com",
    action: "LOGIN",
    ipAddress: "192.168.1." + (i % 255),
    userAgent: "TestAgent",
    metadata: {},
    status: "SUCCESS",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
```

Then test query performance:
```javascript
// Should be fast with indexes
db.useraudits.find({userId: ObjectId("507f1f77bcf86cd799439011")})
  .sort({createdAt: -1})
  .limit(50)
  .explain("executionStats")
```

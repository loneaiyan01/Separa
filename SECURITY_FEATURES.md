# Advanced Security Features Documentation

## Overview
Separa now includes comprehensive security features to protect rooms and ensure safe video conferencing. This document outlines all available security features and how to use them.

---

## 🔐 Security Features

### 1. **End-to-End Encryption (E2EE) Indicators**
- **Feature**: Toggle E2EE for rooms
- **Status**: Tracked in audit logs and room metadata
- **API Endpoint**: `POST /api/rooms/[roomId]/security`
- **Usage**:
  ```json
  {
    "action": "update_security_config",
    "actorName": "admin",
    "securityConfig": {
      "e2eeEnabled": true,
      "e2eeKeyRotationInterval": 60
    }
  }
  ```

### 2. **Session Passwords**
- **Feature**: Temporary passwords separate from room passwords
- **Expiry**: Can be set with custom expiration time
- **Use Case**: Grant temporary access without sharing the main room password
- **API Endpoint**: `POST /api/rooms/[roomId]/security`
- **Usage**:
  ```json
  {
    "action": "set_session_password",
    "actorName": "host",
    "password": "temp123",
    "expiryMinutes": 60
  }
  ```

### 3. **IP-Based Access Control**

#### **IP Blocking**
- Block specific IP addresses from joining rooms
- Add expiration times for temporary bans
- Include reasons for blocking
- **API Endpoint**: `POST /api/rooms/[roomId]/security`
- **Usage**:
  ```json
  {
    "action": "block_ip",
    "actorName": "moderator",
    "ip": "192.168.1.100",
    "reason": "Disruptive behavior",
    "expiresAt": 1735689600000
  }
  ```

#### **IP Whitelisting**
- Allow specific IPs to bypass all blocks
- Useful for trusted moderators
- **API Endpoint**: `POST /api/rooms/[roomId]/security`
- **Usage**:
  ```json
  {
    "action": "add_allowed_ip",
    "actorName": "admin",
    "ip": "192.168.1.50"
  }
  ```

### 4. **Rate Limiting & Login Protection**
- **Max Login Attempts**: Configurable (default: 5)
- **Lockout Duration**: Configurable in minutes (default: 15)
- **Automatic Lockout**: IPs are temporarily blocked after exceeding max attempts
- **Auto-Reset**: Failed attempts reset after lockout period expires

### 5. **Audit Logs**
Comprehensive logging of all security-related actions.

#### **Logged Actions**:
- `room_created` - Room creation
- `room_updated` - Room settings changes
- `room_deleted` - Room deletion
- `participant_joined` - User joins (with IP, gender, host status)
- `participant_left` - User leaves
- `participant_kicked` - User removed by host
- `participant_banned` - User banned
- `ip_blocked` - IP address blocked
- `ip_unblocked` - IP address unblocked
- `password_changed` - Room password changed
- `session_password_set` - Session password set/updated
- `settings_updated` - Security settings updated
- `e2ee_enabled` - E2EE enabled
- `e2ee_disabled` - E2EE disabled

#### **Audit Log Structure**:
```typescript
{
  id: string;              // Unique log ID
  roomId: string;          // Room identifier
  action: AuditAction;     // Action type
  actorName: string;       // Who performed the action
  actorIdentity?: string;  // LiveKit identity
  targetName?: string;     // Who was affected
  details: string;         // Human-readable description
  timestamp: number;       // Unix timestamp
  ipAddress?: string;      // Client IP
  metadata?: object;       // Additional context
}
```

---

## 📡 API Endpoints

### **1. Audit Logs**

#### `GET /api/audit-logs`
Fetch audit logs with filtering options.

**Query Parameters**:
- `roomId` - Filter by room ID
- `action` - Filter by action type
- `actorName` - Filter by actor name (partial match)
- `startTime` - Filter by start timestamp
- `endTime` - Filter by end timestamp
- `limit` - Limit number of results
- `stats=true` - Get statistics instead of logs

**Example**:
```bash
GET /api/audit-logs?roomId=abc123&action=participant_joined&limit=50
```

**Response**:
```json
{
  "logs": [...],
  "count": 50,
  "filters": {...}
}
```

#### Get Statistics
```bash
GET /api/audit-logs?roomId=abc123&stats=true
```

**Response**:
```json
{
  "totalLogs": 150,
  "actionCounts": {
    "participant_joined": 45,
    "room_updated": 10,
    "ip_blocked": 2
  },
  "recentActivity": [...]
}
```

### **2. Room Security Management**

#### `GET /api/rooms/[roomId]/security`
Get room security information (sanitized).

**Response**:
```json
{
  "blockedIps": [
    {
      "ip": "192.168.1.100",
      "reason": "Disruptive behavior",
      "bannedAt": 1735689600000,
      "expiresAt": 1735776000000
    }
  ],
  "allowedIps": ["192.168.1.50"],
  "hasSessionPassword": true,
  "sessionPasswordExpiry": 1735689600000,
  "securityConfig": {
    "e2eeEnabled": true,
    "maxLoginAttempts": 5,
    "lockoutDuration": 15
  }
}
```

#### `POST /api/rooms/[roomId]/security`
Manage security settings.

**Actions**:

##### 1. Block IP
```json
{
  "action": "block_ip",
  "actorName": "moderator",
  "ip": "192.168.1.100",
  "reason": "Spam",
  "expiresAt": 1735776000000
}
```

##### 2. Unblock IP
```json
{
  "action": "unblock_ip",
  "actorName": "moderator",
  "ip": "192.168.1.100"
}
```

##### 3. Clean Expired Bans
```json
{
  "action": "clean_expired_bans",
  "actorName": "admin"
}
```

##### 4. Add to Whitelist
```json
{
  "action": "add_allowed_ip",
  "actorName": "admin",
  "ip": "192.168.1.50"
}
```

##### 5. Remove from Whitelist
```json
{
  "action": "remove_allowed_ip",
  "actorName": "admin",
  "ip": "192.168.1.50"
}
```

##### 6. Update Security Config
```json
{
  "action": "update_security_config",
  "actorName": "admin",
  "securityConfig": {
    "e2eeEnabled": true,
    "maxLoginAttempts": 3,
    "lockoutDuration": 30
  }
}
```

##### 7. Set Session Password
```json
{
  "action": "set_session_password",
  "actorName": "host",
  "password": "temp123",
  "expiryMinutes": 120
}
```

##### 8. Remove Session Password
```json
{
  "action": "remove_session_password",
  "actorName": "host"
}
```

### **3. Enhanced Room APIs**

#### `POST /api/rooms`
Create a room with security features.

```json
{
  "name": "Study Group",
  "description": "Weekly study session",
  "template": "brothers-only",
  "locked": true,
  "password": "mypassword",
  "sessionPassword": "tempaccesss",
  "creator": "admin"
}
```

#### `PATCH /api/rooms/[roomId]`
Update room with audit logging.

```json
{
  "actorName": "admin",
  "name": "Updated Room Name",
  "securityConfig": {
    "e2eeEnabled": true
  }
}
```

#### `GET /api/rooms/[roomId]`
Get room details (sanitized).

**Response**:
```json
{
  "id": "abc123",
  "name": "Study Group",
  "template": "brothers-only",
  "hasPassword": true,
  "hasSessionPassword": true,
  "sessionPasswordExpired": false,
  "blockedIpsCount": 2,
  "allowedIpsCount": 1,
  "securityConfig": {
    "e2eeEnabled": true
  }
}
```

### **4. Token Generation (Enhanced)**

#### `POST /api/token`
Join a room with enhanced security checks.

**Security Checks Performed**:
1. Rate limiting (max attempts)
2. IP blocking validation
3. IP whitelist check
4. Room password verification
5. Session password verification (if set)
6. Session password expiry check
7. Gender restriction validation

**Request**:
```json
{
  "roomId": "abc123",
  "participantName": "John",
  "gender": "male",
  "isHost": false,
  "roomPassword": "mypassword"
}
```

**Response** (Success):
```json
{
  "token": "eyJhbGciOi...",
  "room": {
    "id": "abc123",
    "name": "Study Group",
    "e2eeEnabled": true
  }
}
```

**Response** (Rate Limited):
```json
{
  "error": "Too many failed attempts. Try again later.",
  "lockedUntil": 1735689600000
}
```

---

## 🔧 Security Configuration Options

### `SecurityConfig` Interface:
```typescript
{
  e2eeEnabled: boolean;                    // Enable/disable E2EE
  e2eeKeyRotationInterval?: number;        // Key rotation in minutes
  requireVerifiedParticipants?: boolean;   // Future: Require verification
  maxLoginAttempts?: number;               // Max failed login attempts (default: 5)
  lockoutDuration?: number;                // Lockout duration in minutes (default: 15)
  allowedIpRanges?: string[];              // CIDR notation (future feature)
  geoBlockEnabled?: boolean;               // Geographic blocking (future)
  blockedCountries?: string[];             // ISO country codes (future)
}
```

---

## 🛡️ Best Practices

### 1. **Room Creation**
- Always set a strong password for locked rooms
- Use session passwords for temporary access
- Set reasonable expiry times for session passwords

### 2. **IP Management**
- Whitelist trusted moderator IPs
- Set expiration times for temporary bans
- Regularly clean expired bans
- Document reasons for IP blocks

### 3. **Rate Limiting**
- Adjust `maxLoginAttempts` based on room security needs
- Use shorter `lockoutDuration` for high-traffic rooms
- Monitor audit logs for suspicious patterns

### 4. **Audit Logs**
- Review logs regularly for security incidents
- Use filters to identify patterns
- Export logs for compliance purposes
- Monitor failed login attempts

### 5. **E2EE**
- Enable E2EE for sensitive discussions
- Set appropriate key rotation intervals
- Inform participants about E2EE status

---

## 📊 Monitoring & Analytics

### Track Security Events
```bash
# Get all security-related actions
GET /api/audit-logs?action=ip_blocked&action=password_changed&limit=100

# Monitor failed logins
GET /api/audit-logs?roomId=abc123&stats=true

# Check recent activity
GET /api/audit-logs?roomId=abc123&limit=20
```

### Common Queries
```bash
# Failed login attempts in last hour
GET /api/audit-logs?roomId=abc123&startTime=<timestamp>&action=participant_joined

# IP blocks in last 24 hours
GET /api/audit-logs?action=ip_blocked&startTime=<timestamp>

# Password changes
GET /api/audit-logs?action=password_changed&action=session_password_set
```

---

## 🚀 Future Enhancements

- [ ] Geographic IP blocking by country
- [ ] CIDR range blocking
- [ ] Two-factor authentication
- [ ] Email verification for participants
- [ ] Webhook notifications for security events
- [ ] Real-time security dashboard
- [ ] Automated threat detection
- [ ] Export audit logs (CSV, JSON)
- [ ] Integration with external security services

---

## 🔒 Security Notes

1. **Passwords**: All passwords are hashed using SHA-256 before storage
2. **IP Addresses**: Extracted from `x-forwarded-for`, `x-real-ip`, or `cf-connecting-ip` headers
3. **Rate Limiting**: Stored in-memory (consider Redis for production)
4. **Audit Logs**: Stored in `data/audit-logs.json` (max 10,000 entries)
5. **Session Passwords**: Automatically expire based on `sessionPasswordExpiry`

---

## 📝 Example Workflows

### Scenario 1: Create Secure Room
```bash
# 1. Create room with password
POST /api/rooms
{
  "name": "Private Meeting",
  "template": "mixed-host-required",
  "locked": true,
  "password": "secure123",
  "creator": "admin"
}

# 2. Enable E2EE
POST /api/rooms/abc123/security
{
  "action": "update_security_config",
  "actorName": "admin",
  "securityConfig": { "e2eeEnabled": true }
}

# 3. Set session password for guests
POST /api/rooms/abc123/security
{
  "action": "set_session_password",
  "actorName": "admin",
  "password": "guest123",
  "expiryMinutes": 120
}
```

### Scenario 2: Handle Disruptive User
```bash
# 1. Block user's IP
POST /api/rooms/abc123/security
{
  "action": "block_ip",
  "actorName": "moderator",
  "ip": "192.168.1.100",
  "reason": "Disruptive behavior",
  "expiresAt": 1735776000000
}

# 2. Check audit log
GET /api/audit-logs?roomId=abc123&actorName=DisruptiveUser

# 3. Unblock after review
POST /api/rooms/abc123/security
{
  "action": "unblock_ip",
  "actorName": "admin",
  "ip": "192.168.1.100"
}
```

---

## 💡 Support

For questions or issues with security features:
1. Check audit logs for detailed error information
2. Review this documentation
3. Contact system administrator

---

**Last Updated**: 2025-11-27
**Version**: 1.0.0

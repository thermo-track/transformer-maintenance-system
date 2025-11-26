# User Role Management System

## Overview
This system allows users to request additional roles (e.g., Maintenance Engineer) and enables administrators to review and approve/reject these requests.

## Components

### Backend (Spring Boot)

#### Entities
- **RoleChangeRequest.java**: Represents a user's role change request
  - Fields: id, user, requestedRole, reason, status, requestedAt, reviewedAt, reviewedBy, reviewComment
  - Status flow: PENDING → APPROVED/REJECTED

#### Repositories
- **RoleChangeRequestRepository.java**: JPA repository for role change requests
  - Methods: findByStatus, findByUserAndStatus, findByUser

#### Services
- **RoleChangeRequestService.java**: Business logic for role change workflow
  - createRoleChangeRequest(): Creates new request
  - reviewRoleChangeRequest(): Approves/rejects request and updates user role
  - getAllRoleChangeRequests(): Fetches all requests
  - getPendingRoleChangeRequests(): Fetches pending requests only
  - getMyRoleChangeRequests(): Fetches current user's requests
  - cancelRoleChangeRequest(): Allows user to cancel pending request

#### Controllers
- **RoleChangeRequestController.java**: REST API endpoints
  - POST /api/role-change-requests - Create new request
  - GET /api/role-change-requests - Get all requests (admin only)
  - GET /api/role-change-requests/pending - Get pending requests (admin only)
  - GET /api/role-change-requests/my-requests - Get current user's requests
  - PUT /api/role-change-requests/{id}/review - Approve/reject request (admin only)
  - DELETE /api/role-change-requests/{id} - Cancel request

#### Database
- **V7__create_role_change_requests_table.sql**: Flyway migration
  - Creates role_change_requests table
  - Foreign key to users table
  - Indexes on status and user_id for performance

### Frontend (React)

#### Admin Components
- **UserManagement.jsx**: Admin interface for reviewing role change requests
  - Location: `src/features/admin/UserManagement.jsx`
  - Features:
    - Table view of all role change requests
    - Filter by pending/all requests
    - Review modal with approve/reject actions
    - Comment system for admin feedback
    - Status badges (pending/approved/rejected)
    - Access control: Only visible to ROLE_ADMIN

- **UserManagement.css**: Styling for admin component
  - Location: `src/features/admin/UserManagement.css`
  - Includes: Table styles, modal styles, badges, buttons, responsive design

#### User Components
- **RequestRoleChange.jsx**: User interface for requesting role changes
  - Location: `src/features/profile/RequestRoleChange.jsx`
  - Features:
    - Form to submit new role change request
    - Select desired role (Maintenance Engineer)
    - Text area for reason/justification
    - View history of own requests
    - Cancel pending requests
    - See admin comments on reviewed requests

- **RequestRoleChange.css**: Styling for user component
  - Location: `src/features/profile/RequestRoleChange.css`
  - Includes: Form styles, card layouts, badges, alerts, responsive design

#### Routing
Routes added in `App.jsx`:
- `/admin/user-management` - Admin page for reviewing requests
- `/profile/request-role-change` - User page for requesting role changes

#### Navigation
Menu items added in `menuData.js`:
- Admin section: "Role Requests" (admin only)
- Settings section: "Request Role Change" (all users)

## User Flow

### For Regular Users
1. Navigate to Settings → Request Role Change
2. View current role and available roles to request
3. Select "Maintenance Engineer" role
4. Provide detailed reason for request
5. Submit request (status: PENDING)
6. View request history showing status
7. Receive notification when admin reviews (approved/rejected)
8. Can cancel pending requests if needed

### For Administrators
1. Navigate to User Management → Role Requests
2. View table of all role change requests
3. Filter by "Pending Requests" or "All Requests"
4. Click "Review" button on pending request
5. Review modal shows:
   - User details (name, email, department)
   - Current role
   - Requested role
   - Reason provided by user
6. Add optional comment
7. Click "Approve" or "Reject"
8. System automatically updates user role if approved

## Workflow Diagram

```
User submits request
        ↓
   Status: PENDING
        ↓
Admin reviews request
        ↓
    ┌───┴───┐
    ↓       ↓
APPROVED  REJECTED
    ↓
User role updated
```

## Security

- All endpoints require authentication (JWT)
- Admin-only endpoints use `@PreAuthorize("hasRole('ROLE_ADMIN')")`
- Users can only view their own requests
- Users can only cancel their own pending requests
- Role updates are atomic and logged

## Database Schema

```sql
CREATE TABLE role_change_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    requested_role VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(255),
    review_comment TEXT,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
);
```

## Available Roles

- **ROLE_USER**: Default role for all registered users
- **ROLE_MAINTENANCE_ENGINEER**: Can add notes, comments, corrective actions
- **ROLE_ADMIN**: Full system access, can approve role requests

## Testing Checklist

### Backend Testing
- [ ] Create role change request
- [ ] Get all requests (admin)
- [ ] Get pending requests (admin)
- [ ] Get my requests (user)
- [ ] Approve request (admin)
- [ ] Reject request (admin)
- [ ] Cancel request (user)
- [ ] Verify role update after approval
- [ ] Verify non-admin cannot access admin endpoints

### Frontend Testing
- [ ] User can see request form
- [ ] User can submit request with valid data
- [ ] User can view request history
- [ ] User can cancel pending request
- [ ] Admin can see all requests
- [ ] Admin can filter by pending/all
- [ ] Admin can approve request
- [ ] Admin can reject request
- [ ] Admin can add comments
- [ ] Non-admin cannot access admin page
- [ ] Status badges display correctly
- [ ] Responsive design works on mobile

## Future Enhancements

1. Email notifications when request is reviewed
2. Bulk approval/rejection for admins
3. Request expiration after certain period
4. Role hierarchy and automatic approvals
5. Audit log for all role changes
6. Request templates for common scenarios

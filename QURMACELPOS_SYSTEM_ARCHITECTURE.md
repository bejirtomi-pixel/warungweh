# QURMACELPOS SYSTEM ARCHITECTURE
## Version 1.0 — Master Technical Documentation

**Project:** QurmacelPOS  
**Category:** Point of Sale & Restaurant Management System  
**Architecture Status:** Development  
**Document Purpose:** Master technical reference for all future development.

---

# 1. PROJECT OVERVIEW

QurmacelPOS is a Point of Sale (POS) and restaurant management application designed to manage store operations, transactions, inventory, customer orders, table sessions, payments, employees, and business reports.

The system supports two primary environments:

1. Internal Management System — used by Super Admin, Admin, and Cashier.
2. Customer Ordering System — a public-facing digital menu accessed through table QR codes.

Both environments use a centralized data architecture.

The system must maintain consistent transaction records, inventory data, user permissions, and activity history.

## Core Objectives

- Centralized transaction management.
- Multi-user authentication.
- Granular role-based permissions.
- Dine In, Delivery, and Pickup order management.
- QR-based customer ordering.
- Table session management.
- Multiple payment methods.
- Inventory management.
- Complete activity tracking.
- Business analytics and reporting.
- Secure and scalable architecture.

---

# 2. TECHNOLOGY STACK

Existing project technologies must be preserved unless an architectural audit identifies a necessary change.

## Frontend
- React
- Vite
- Tailwind CSS
- Lucide React
- Framer Motion

## Backend and Infrastructure
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK
- Trusted serverless backend
- Vercel deployment

## Backend Execution

Choose one primary trusted backend execution environment after auditing the current repository:

- Vercel Functions, or
- Firebase Cloud Functions.

Do not implement competing administrative backends unnecessarily.

All privileged operations must execute in a trusted server environment.

Firebase Admin SDK credentials must never be exposed to frontend code.

---

# 3. SYSTEM ARCHITECTURE

The application consists of two primary environments.

## A. INTERNAL MANAGEMENT SYSTEM

Accessible only to authenticated and authorized users.

Modules:

- Dashboard
- Barang
- Transaksi
- Meja
- Laporan
- Pengaturan
- Manajemen Pengguna
- Riwayat Aktivitas

## B. CUSTOMER ORDERING SYSTEM

Public-facing customer interface.

Modules:

- Digital Menu
- Product Details
- Shopping Cart
- Order Submission
- Order Status
- Payment Options

Customers must never receive access to internal administrative data.

The public application must expose only the minimum information required for ordering.

---

# 4. MULTI-USER AUTHENTICATION

The system supports three primary roles.

## SUPER ADMIN

Highest administrative authority.

Permissions:
- Full system access.
- Manage all users.
- Create and manage Super Admin accounts through protected administrative operations.
- Assign roles.
- Configure granular permissions.
- Approve or reject registrations.
- Access all activity history.
- Manage store settings.
- Access all reports.
- Manage security settings.

## ADMIN

Operational management role.

Permissions:
- Determined individually by Super Admin.
- Can access assigned modules.
- Can perform only explicitly granted actions.
- Cannot modify their own permissions.
- Cannot promote themselves.
- Cannot modify Super Admin accounts.

## CASHIER

Operational transaction role.

Default permissions:
- Access cashier dashboard.
- View products.
- Create transactions.
- Process assigned orders.
- Access permitted table operations.
- View personal activity history.

Additional permissions can be assigned by Super Admin if required.

## USER IDENTITY

Each user must have an individual account.

Identity must be based on verified Firebase UID.

Never use manually entered names as the authoritative identity for an activity.

## ACCOUNT STATUS

Supported statuses:

- PENDING
- ACTIVE
- SUSPENDED
- REJECTED

Only ACTIVE accounts may access authorized internal application modules.

---

# 5. REGISTRATION SYSTEM

Two registration methods are supported.

## A. Super Admin Created Accounts

Super Admin can create accounts from the application.

Account creation must use a trusted backend and Firebase Admin SDK.

Supported information:
- Full name
- Email
- Role
- Account status
- Initial activation method

Never store plaintext passwords.

Use secure password setup or account activation procedures.

## B. Self Registration

Users can register through:

- Email and Password
- Google Authentication

New registrations receive PENDING status.

Registration workflow:

1. User submits registration.
2. Firebase Authentication creates or authenticates the identity.
3. A registration request is recorded.
4. Internal access remains blocked.
5. Super Admin reviews the request.
6. Super Admin approves or rejects it.
7. Super Admin assigns the appropriate role.
8. Approved users receive ACTIVE status.

Public registration must never allow users to select their own administrative privileges.

Google and email/password identities must be handled safely, including account linking where appropriate.

---

# 6. GRANULAR PERMISSION SYSTEM

Permission must be independent from role.

Role defines the general user category.

Permission defines the exact actions a user can perform.

## Permission Categories

### PAGE ACCESS
Determines whether a user can access a module.

### ACTION PERMISSION
Determines whether a user can perform a specific operation.

## Permission Reference

Barang:
- barang.view
- barang.create
- barang.update
- barang.delete
- barang.change_price
- barang.adjust_stock

Transaksi:
- transaksi.view
- transaksi.create
- transaksi.update
- transaksi.cancel
- transaksi.refund

Meja:
- meja.view
- meja.manage
- meja.open_session
- meja.close_session
- meja.qr_manage

QR Menu:
- qr_menu.view
- qr_menu.manage
- qr_menu.order_monitor

Laporan:
- laporan.view
- laporan.export
- laporan.view_profit

Pengguna:
- pengguna.view
- pengguna.create
- pengguna.update
- pengguna.deactivate
- pengguna.change_role
- pengguna.manage_permissions
- pengguna.approve_registration

Activity History:
- history.view_all
- history.view_own

Pengaturan:
- pengaturan.view
- pengaturan.update

Super Admin retains full administrative authority.

All other permissions must be explicitly validated.

Frontend visibility is not a security mechanism.

Backend authorization and Firebase Security Rules must enforce access.

---

# 7. CENTRALIZED ORDER MANAGEMENT

All order types must use one centralized transaction architecture.

Supported Order Types:

1. DINE_IN
2. DELIVERY
3. PICKUP

Each order must have an explicit orderType.

Different order types may have different operational workflows, but must remain integrated with the same transaction system.

## DINE IN

- Linked to a table.
- Linked to an active table session.
- Supports customer QR ordering.
- Supports multiple orders within one session.
- Uses one consolidated session bill.

## DELIVERY

- Has delivery/customer information.
- Does not require a table session.
- Has its own delivery workflow.

## PICKUP

- Has pickup information.
- Does not require a table session.
- Has its own pickup workflow.

Do not mix the operational workflows of these order types.

---

# 8. TABLE MANAGEMENT

Each table must have:

- Unique table ID.
- Table name or number.
- QR token.
- Table status.
- Active session reference.
- Created timestamp.
- Updated timestamp.

## Table Status

- AVAILABLE
- OCCUPIED
- RESERVED (optional future feature)
- DISABLED

A table can have only one ACTIVE session at a time.

## Table Session

A table session represents one continuous customer dining period.

Suggested information:

- sessionId
- tableId
- sessionStatus
- openedAt
- openedBy
- closedAt
- closedBy
- orderIds
- paymentStatus
- totalAmount

## Session Rules

1. Only one active session per table.
2. Multiple orders may belong to the same session.
3. Closing a session prevents further orders from being added to it.
4. A new session must be explicitly opened after the previous session closes.
5. Session history must remain available.
6. All accepted Dine In orders must reference their correct session.

Use transactional database operations to prevent concurrent session creation.

---

# 9. QR MENU CUSTOMER ORDERING

The customer QR Menu is a public ordering interface.

It must be separate from the internal cashier interface.

## QR TOKEN

Each table has a stable QR identity.

QR codes must:
- Be generated by the application.
- Be displayed on the cashier PC during development.
- Support future PNG/PDF export.
- Support future physical printing.
- Be revocable or replaceable by authorized administrators.

Never expose internal Firebase document IDs or privileged credentials as security mechanisms.

Use secure, sufficiently unpredictable public QR tokens.

## QR AVAILABILITY

QR codes remain accessible at all times.

However, order submission requires an eligible active table session.

If no active session exists, show an appropriate waiting or unavailable message and prevent order submission.

## CUSTOMER ORDER WORKFLOW

1. Customer scans the table QR.
2. Customer enters the public digital menu.
3. System resolves the table using its QR token.
4. Customer views available products.
5. Customer adds products to the cart.
6. Customer submits the order.
7. System creates a new PENDING order.
8. Cashier receives a real-time notification.
9. Cashier reviews and accepts or rejects the order.
10. Accepted orders are attached to the active table session.
11. Customer can submit additional orders.
12. All accepted orders remain within the same session bill.

## REPEATED QR SCANNING

The selected behavior is:

**New Order, Same Active Session.**

Every new customer submission creates a distinct order record.

It must not automatically create a new table session.

After cashier approval, the new order is attached to the existing active session.

The previous order history must remain intact.

## ORDER SUBMISSION SAFETY

Use idempotency keys to prevent duplicate orders caused by repeated button clicks or network retries.

Validate:
- QR token.
- Table status.
- Active session.
- Product availability.
- Current product price.
- Order quantities.
- Request validity.

Use trusted server-side validation.

---

# 10. ORDER STATUS MANAGEMENT

Recommended order statuses:

- PENDING
- ACCEPTED
- PREPARING
- READY
- COMPLETED
- REJECTED
- CANCELLED

The customer interface should display appropriate order status information.

The cashier interface should provide order management controls based on permission.

Order status transitions must be validated.

For example, rejected orders must never enter the active session bill.

Completed orders must remain part of the session's financial history.

---

# 11. PAYMENT MANAGEMENT

Supported payment methods:

- CASH
- QRIS_STATIC
- QRIS_ONLINE
- Other methods supported by the existing application.

## Payment Status

- UNPAID
- PENDING
- PARTIALLY_PAID
- PAID
- FAILED
- REFUNDED

## PAYMENT RULES

### Cashier Payment

Payment is processed through the cashier.

Existing cashier payment workflows must remain operational.

### QRIS Static / EDC

Static QRIS and EDC must be treated separately from online gateway payments.

Do not automatically mark static QRIS payments as verified without the application's appropriate confirmation process.

### QRIS Online

Online payment must use a trusted payment gateway.

Requirements:
- Server-side payment creation.
- Secure webhook endpoint.
- Webhook signature verification.
- Idempotent payment processing.
- Amount validation.
- Order/session reference validation.
- Payment status synchronization.

Never mark a payment as successful based only on frontend responses or customer-uploaded screenshots.

## ADDITIONAL ORDERS AFTER PAYMENT

A session may receive additional orders after an earlier payment.

The system must correctly calculate:

- Total accepted orders.
- Total paid.
- Outstanding balance.
- Additional payments.
- Remaining balance.

A previous payment must not automatically settle newly added orders.

Every payment must be traceable to the correct session and amount.

---

# 12. INVENTORY MANAGEMENT

Inventory must remain consistent with accepted transactions.

Recommended rules:

1. Validate product availability before accepting an order.
2. Prevent negative stock.
3. Handle simultaneous purchases safely.
4. Record stock movements.
5. Maintain historical inventory records.
6. Distinguish accepted, rejected, and cancelled orders.
7. Keep product snapshots in transaction records.

Recommended stock movement types:

- STOCK_IN
- STOCK_OUT
- STOCK_ADJUSTMENT
- TRANSACTION_DEDUCTION
- TRANSACTION_REVERSAL

The exact deduction and reversal timing must be implemented consistently with the existing inventory workflow.

Product snapshots must preserve:
- Product name.
- Unit price.
- Quantity.
- Subtotal.
- Relevant product information.

Historical transactions must never change when the current product price or name is edited.

---

# 13. ACTIVITY HISTORY / AUDIT TRAIL

Every important action must be recorded.

Activity fields:

- activityId
- actorUid
- actorName
- actorEmail
- actorRole
- action
- module
- targetId
- targetName
- before
- after
- status
- timestamp
- metadata

Activities include:

- Login.
- Logout.
- Product creation.
- Product editing.
- Product deletion.
- Stock adjustment.
- Transaction creation.
- Transaction cancellation.
- Payment confirmation.
- Table session creation.
- Table session closure.
- QR management.
- User creation.
- User approval.
- Role changes.
- Permission changes.
- Settings changes.

Activity history must be generated through trusted operations.

Normal users must not be able to modify or delete audit records.

Access:
- Super Admin: all activities.
- Admin: activities according to permission.
- Cashier: own activities when authorized.

Provide filtering by:
- User.
- Role.
- Module.
- Action.
- Date range.
- Status.

---

# 14. REAL-TIME NOTIFICATIONS

The system should support real-time operational notifications.

Examples:

- New customer order.
- Pending order requiring cashier approval.
- Payment confirmation.
- Low stock.
- Registration request.
- Order cancellation.

Notifications must be linked to the appropriate user permissions.

Use real-time database listeners or another suitable notification mechanism.

Avoid unnecessary listeners that increase database usage.

Provide appropriate feedback when connectivity is interrupted.

---

# 15. REPORTING AND ANALYTICS

The reporting module should support:

## Sales Reports
- Daily sales.
- Weekly sales.
- Monthly sales.
- Custom date range.

## Order Type Reports
- Dine In.
- Delivery.
- Pickup.

## Payment Reports
- Cash.
- QRIS Static.
- QRIS Online.
- Other methods.

## Product Reports
- Best-selling products.
- Product sales quantities.
- Revenue by product.

## Employee Reports
- Transactions by cashier.
- Activity by employee.
- Operational performance.

## Inventory Reports
- Stock movements.
- Low-stock products.
- Inventory adjustments.

## Financial Reports
- Gross sales.
- Discounts.
- Refunds.
- Net revenue.
- Profit estimates based on recorded costs.

Financial reports must use consistent transaction and payment definitions.

---

# 16. SECURITY ARCHITECTURE

Mandatory security rules:

1. Firebase Authentication is the identity provider.
2. Firebase UID is the primary user identity.
3. Backend authorization is required for privileged operations.
4. Firestore Security Rules must enforce data access.
5. Frontend role checks are only for UI presentation.
6. Never expose Firebase Admin SDK credentials.
7. Never store plaintext passwords.
8. Never trust client-supplied role or actor identity.
9. Prevent self-promotion.
10. Prevent unauthorized data modification.
11. Validate public QR requests.
12. Apply rate limiting to public order submission and sensitive endpoints.
13. Protect payment webhooks.
14. Revoke access for suspended accounts.
15. Protect the last Super Admin account.
16. Maintain a secure Super Admin recovery procedure.

Permission changes must take effect without relying indefinitely on stale authentication claims.

---

# 17. DATABASE DESIGN REFERENCE

The following is a conceptual Firestore structure.

The final implementation must be based on an audit of the existing database.

Suggested collections:

users/{uid}

registration_requests/{requestId}

products/{productId}

categories/{categoryId}

tables/{tableId}

table_sessions/{sessionId}

orders/{orderId}

payments/{paymentId}

stock_movements/{movementId}

activity_logs/{activityId}

notifications/{notificationId}

settings/{settingId}

Additional subcollections may be used when justified.

## DATA RELATIONSHIPS

- Each user has one Firebase UID.
- Each table can have one active session.
- Each session can contain multiple orders.
- Each order has one orderType.
- Each Dine In order references a table session.
- Each payment references the relevant transaction or session.
- Each stock movement references its source operation.
- Each audit entry identifies the responsible user.

Use Firestore transactions or batched writes when consistency requires atomic operations.

Avoid duplicating authoritative financial values across documents without a reconciliation strategy.

---

# 18. BACKUP AND SYSTEM MONITORING

Future infrastructure requirements:

- Scheduled Firestore backups.
- Recovery testing.
- Error logging.
- Failed transaction monitoring.
- Payment webhook monitoring.
- Authentication monitoring.
- Database usage monitoring.
- Connectivity status indicators.

Backup and recovery must be tested, not merely configured.

Never treat localStorage as the authoritative backup of cloud transaction data.

---

# 19. FUTURE DEVELOPMENT ROADMAP

## PHASE 1 — CORE FOUNDATION
- Multi-user authentication.
- Super Admin.
- Admin.
- Cashier.
- Granular permission.
- User management.
- Self-registration approval.
- Activity History.

## PHASE 2 — ORDERING SYSTEM
- Table management.
- Table sessions.
- Stable QR tokens.
- Public QR Menu.
- Customer ordering.
- Cashier order approval.
- Consolidated session billing.

## PHASE 3 — OPERATIONAL INTEGRATION
- Real-time notifications.
- Inventory consistency.
- Payment gateway.
- QRIS Online.
- Payment reconciliation.

## PHASE 4 — BUSINESS INTELLIGENCE
- Advanced reports.
- Employee performance.
- Stock analytics.
- Automated backups.
- System monitoring.

## FUTURE OPTIONAL FEATURES
- Kitchen Display System.
- Customer loyalty.
- Customer order history.
- Smart stock alerts.
- Advanced business analytics.

These future features must not be implemented prematurely if core architecture is not stable.

---

# 20. DEVELOPMENT RULES FOR AI CODING AGENTS

Every future AI coding agent working on QurmacelPOS must follow these rules.

1. Read this architecture document before implementing a new feature.
2. Audit the existing repository before modifying code.
3. Never assume filenames or database schemas without inspection.
4. Preserve existing functional features.
5. Never reset production data.
6. Never rewrite entire modules without justification.
7. Preserve existing design conventions.
8. Maintain backward compatibility.
9. Validate permissions on the backend.
10. Maintain transaction consistency.
11. Preserve historical records.
12. Use appropriate error handling.
13. Test desktop and mobile layouts.
14. Run production builds after implementation.
15. Document database changes.
16. Document new environment variables.
17. Document Firebase configuration requirements.
18. Report incomplete integrations honestly.
19. Do not use dummy data as a replacement for real functionality.
20. Request approval before destructive or irreversible changes.

## IMPLEMENTATION WORKFLOW

For every new feature:

STEP 1 — Inspect relevant files and existing functionality.

STEP 2 — Identify dependencies and data relationships.

STEP 3 — Explain the proposed implementation.

STEP 4 — Identify security and migration risks.

STEP 5 — Implement in small, verifiable stages.

STEP 6 — Run tests and production build.

STEP 7 — Report modified files, test results, and remaining work.

---

# 21. ARCHITECTURE CHANGE MANAGEMENT

This document is the master technical reference.

Any significant change to:

- Authentication.
- User roles.
- Permissions.
- Database structure.
- Order types.
- Table sessions.
- QR Menu.
- Payment processing.
- Inventory.
- Audit history.

Must be reflected in this document.

Maintain a version history whenever architectural decisions change.

Do not silently replace previously agreed decisions.

---

**END OF DOCUMENT**

QurmacelPOS — System Architecture v1.0

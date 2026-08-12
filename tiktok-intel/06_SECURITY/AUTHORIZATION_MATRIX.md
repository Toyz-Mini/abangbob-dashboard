# Authorization Matrix

Roles:
OWNER, ADMIN, MARKETER, VIEWER.

Every endpoint and UI action must map to permissions.

Example:
Delete shop: OWNER only.
Manage members: OWNER/ADMIN.
Upload: OWNER/ADMIN/MARKETER.
View: all authorized roles.
Run analysis: OWNER/ADMIN/MARKETER/VIEWER if business policy permits.

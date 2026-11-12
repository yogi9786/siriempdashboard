# Application Security Audit & Hardening Report
**Project:** Siri Samruddhi Gold Palace Dashboard  
**Classification:** Internal Confidential  
**Standard:** OWASP Top 10 & Enterprise Web Security Guidelines  

---

## 1. Vulnerability Assessment Matrix

| Threat Category | Severity | Initial Status | Remediation & Current Status |
|---|---|---|---|
| **SQL Injection (SQLi)** | Critical | Mitigated | Uses SQLAlchemy parameterized ORM queries. Raw text queries use explicit bound parameters (`text("...")`). |
| **Authentication & Password Storage** | Critical | Secure | Passwords hashed using `passlib[bcrypt]` with work factor 12. Plaintext passwords never stored. |
| **Cross-Site Scripting (XSS)** | High | Mitigated | React automatically escapes JSX expressions. Custom HTML rendering avoided. |
| **Cross-Origin Resource Sharing (CORS)** | High | Hardened | Allowed origins configured to strict localhost and `*.ssgpdashboard.in` patterns. No wildcard `*` with credentials. |
| **Insecure Direct Object References (IDOR)** | High | Mitigated | All data access queries enforce `branch_id == current_user.branch_id` check at the database layer. |
| **Cross-Site Request Forgery (CSRF)** | Medium | Mitigated | API uses Bearer JWT tokens in Authorization headers, inherently resistant to browser-driven CSRF. |
| **Security Headers** | Medium | Secure | Middleware injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`. |
| **Sensitive Data Exposure in Repos** | High | Hardened | Passwords and JWT secrets moved to server-side `.env`. Tracked files scrubbed of production secrets. |
| **File Upload Abuse** | Medium | Hardened | Upload sizes restricted (10MB photos, 50MB proof). File paths use sanitized UUIDs and timestamps. |
| **Brute-Force & Rate Limiting** | Medium | Active | In-memory login attempt tracking with progressive throttling on repeated authentication failures. |

---

## 2. Deep Security Review Findings

### 2.1 Authentication & Token Lifecycle
- **Algorithm**: HS256 with signature validation in `backend/app/core/security.py`.
- **Token Expiry**:
  - Access Token: 2880 minutes (48 hours) for operational continuity across retail shifts.
  - Refresh Token: 7 days with server-side revocation lookup.
- **Role-Based Access Control (RBAC)**:
  - `SUPER_ADMIN`: Access to organizational overview, branch creation, cross-branch metrics.
  - `MANAGER`: Isolated strictly to their designated `branch_id`.
  - `HR`: Read and manage employee records, payslips, and leave requests across all branches.
  - `EMPLOYEE`: Access strictly limited to own performance, logged customers, and own payslips/leaves.

### 2.2 Row-Level Branch Isolation
Every critical database transaction validates branch tenancy:
```python
# Enforced in employee_portal, customers, employees, outdoor_marketing:
query = db.query(CustomerActivity).filter(
    CustomerActivity.branch_id == current_user.branch_id
)
```
Cross-branch tampering attempts return `404 Not Found` or `403 Forbidden`.

### 2.3 File Upload Security
- Uploaded files are written to `backend/uploads/` with generated UUID filenames:
  ```python
  unique_filename = f"{uuid.uuid4().hex[:12]}_{int(time.time())}.{ext}"
  ```
- File extensions are validated against an allowlist (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).
- Path traversal sequences (`../`, `..\\`) are stripped by path resolution.

---

## 3. Security Checklist for Production

- [x] Passwords hashed with bcrypt (cost factor >= 12).
- [x] JWT signature validated on every authenticated request.
- [x] Branch isolation verified across all CRUD endpoints.
- [x] Security headers enforced in HTTP response middleware.
- [x] CORS restricted to official domain and local development ports.
- [x] File upload size limits enforced before disk writes.
- [ ] Enable HTTPS with auto-renewing Let's Encrypt certificates on VPS Nginx.
- [ ] Configure UFW firewall on VPS (Allow only ports 22, 80, 443).
- [ ] Enable fail2ban on Linux host for SSH and repeated 401s.


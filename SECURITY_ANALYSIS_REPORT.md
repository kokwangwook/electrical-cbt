# Security Analysis Report - Electrical CBT Project

## Summary
This analysis identified **8 critical and high-severity vulnerabilities** in the electrical CBT project. The most critical issues involve exposed API credentials, hardcoded passwords, XSS vulnerabilities, and unencrypted sensitive data storage.

---

## CRITICAL VULNERABILITIES

### 1. Exposed API Keys and Credentials in .env File
**Severity: CRITICAL**
**Files:** 
- `/home/user/electrical-cbt/.env` (lines 1-6)

**Findings:**
```
VITE_GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/AKfycbzXt0dU9nGbFPVNW5bcmMCo_GXayD1nsbHeHMY538BtzOQlpO6VpZQDFrrFo2HheRN2/exec
VITE_SUPABASE_URL=https://eeyzenpolbrfmsamguvf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVleXplbnBvbGJyZm1zYW1ndXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDg4NjcsImV4cCI6MjA3ODcyNDg2N30.cRxc6STLnhDI2Fm7jADLhhdko50esBNuYOkha3BC0-0
```

**Issues:**
- .env file is committed to git repository (evidence: git log shows commit 7b58ba2)
- Google Apps Script endpoint URL exposed (publicly accessible)
- Supabase project URL exposed
- Supabase anonymous JWT token exposed (valid until 2065)
- These credentials allow anyone to:
  - Query/modify all exam questions in Supabase
  - Execute arbitrary Google Apps Script code
  - Access user data (members, exam results, statistics)

**Impact:** 
- Complete database compromise
- Unauthorized access to all student data
- Data modification/deletion capability
- Service disruption

**Recommendation:**
- Immediately rotate all exposed credentials
- Remove .env from git history (use `git filter-branch` or `git-filter-repo`)
- Use `.env.example` with placeholder values instead
- Add `.env` to `.gitignore`
- Implement environment variable validation at deployment time

---

### 2. Hardcoded Admin Password
**Severity: CRITICAL**
**Files:**
- `/home/user/electrical-cbt/src/pages/Admin.tsx` (lines 62, 270, 1555)

**Findings:**
```typescript
// Line 62
const ADMIN_PASSWORD = 'admin2024';

// Line 270 - Authentication check
if (password === ADMIN_PASSWORD) {
  setIsAuthenticated(true);
}

// Line 1555 - Password displayed in UI
<p className="text-sm text-gray-500 mt-4 text-center">
  기본 비밀번호: admin2024
</p>
```

**Issues:**
- Static password hardcoded in client-side code (easily reverse-engineered)
- Password hint displayed in HTML
- No rate limiting on password attempts
- Simple 8-character password
- Single authentication factor
- No session validation after login

**Impact:**
- Trivial admin access bypass
- Unauthorized access to admin panel
- Full control over all questions, members, and system configuration

**Recommendation:**
- Move password to server-side authentication
- Implement proper authentication (e.g., OAuth, username/password with server validation)
- Add rate limiting and failed attempt tracking
- Use secure password hashing if password-based auth is kept
- Remove password hint from UI
- Implement session tokens (JWT or session IDs)

---

### 3. XSS Vulnerability via dangerouslySetInnerHTML
**Severity: HIGH**
**Files:**
- `/home/user/electrical-cbt/src/components/LatexRenderer.tsx` (line 128)
- `/home/user/electrical-cbt/src/components/MathRenderer.tsx` (line 60)

**Findings:**
```typescript
// LatexRenderer.tsx - Line 128
<Tag
  className={className}
  dangerouslySetInnerHTML={{ __html: renderLatex(text) }}
/>

// MathRenderer.tsx - Line 60
containerRef.current.innerHTML = processedContent;
```

**Issues:**
- `dangerouslySetInnerHTML` used for rendering user-controlled content
- `innerHTML` property directly manipulated in useEffect
- Both rely on KaTeX's built-in sanitization, not explicitly sanitized
- While LaTeX content is primarily mathematical, malicious scripts could be injected through specially crafted input

**Attack Example:**
```
$<img src=x onerror="alert('XSS')">$
```

**Impact:**
- Potential reflected XSS if question content comes from user input
- Session hijacking via cookie theft
- Defacement
- Malware distribution

**Recommendation:**
- Remove `dangerouslySetInnerHTML` usage
- Use React's built-in rendering or a dedicated component library
- If KaTeX output must be rendered as HTML, use `DOMPurify` library:
  ```typescript
  import DOMPurify from 'dompurify';
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderLatex(text)) }}
  ```
- Validate and sanitize all user inputs before rendering
- Use Content Security Policy (CSP) headers

---

## HIGH SEVERITY VULNERABILITIES

### 4. Sensitive Data Stored in localStorage Without Encryption
**Severity: HIGH**
**Files:**
- `/home/user/electrical-cbt/src/services/storage.ts` (multiple lines)
- `/home/user/electrical-cbt/src/services/storage.ts` (lines 685-695)

**Findings:**
localStorage is used extensively to store sensitive data:

```typescript
// Line 685-695 - Current user ID stored in plaintext
export function getCurrentUser(): number | null {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? parseInt(data) : null;
}

export function setCurrentUser(userId: number | null): void {
  if (userId === null) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    localStorage.setItem(CURRENT_USER_KEY, userId.toString());
  }
}
```

**Data Stored in localStorage (unencrypted):**
- User IDs and member information (keys: 'members', 'currentUser')
- Exam results and statistics (keys: 'examResults', 'statistics')
- Wrong answers and learning progress (keys: 'wrongAnswers', 'globalLearningProgress')
- Login history (key: 'LOGIN_HISTORY_KEY')
- Exam sessions including answers (key: 'currentExamSession')
- All question data (key: 'questions')

localStorage usage statistics:
- Over 100 lines of code directly access localStorage
- No encryption or obfuscation
- Synchronous, no integrity checks

**Impact:**
- Data exposure through XSS or malicious browser extensions
- Student learning data accessible to others using the same device
- Ability to forge exam results
- Privacy violation
- No protection against local file inspection

**Recommendation:**
- Use `sessionStorage` for temporary data (cleared on browser close)
- Encrypt sensitive data before storing: use `crypto-js` or `tweetnacl.js`
- Implement client-side encryption with password-derived keys
- Use the Web Crypto API for encryption
- Remove sensitive data when not needed
- Implement proper authentication/authorization server-side
- Store only non-sensitive data locally (e.g., UI preferences)

---

### 5. Client-Side Only Authentication
**Severity: HIGH**
**Files:**
- `/home/user/electrical-cbt/src/pages/Admin.tsx` (lines 60-62, 269-275)
- `/home/user/electrical-cbt/src/pages/Login.tsx` (lines 116-150)

**Findings:**
```typescript
// Admin.tsx - Client-side authentication only
const handleLogin = () => {
  if (password === ADMIN_PASSWORD) {
    setIsAuthenticated(true);  // Just a React state!
  }
};

// Login.tsx - No server validation
const member = getMemberByAnyCredential(trimmedInput);
if (!member) {
  setError('등록되지 않은 사용자입니다.');
}
```

**Issues:**
- Authentication state stored only in React state (in-memory)
- Refreshing page resets authentication
- No server validation of credentials
- No session tokens or secure authentication mechanisms
- No CSRF protection
- localStorage used to store user ID without validation

**Attack Scenarios:**
1. Browser DevTools can modify React state directly
2. Network requests to protected endpoints have no validation
3. Session fixation attacks possible
4. No audit trail of authentication attempts

**Impact:**
- Anyone can modify browser state to bypass authentication
- Unauthorized access to admin panel
- Unauthorized access to user data
- No accountability for actions

**Recommendation:**
- Implement server-side authentication
- Use JWT tokens (not just client-side state)
- Validate every request on server-side
- Implement CSRF tokens
- Use secure HTTP-only cookies for session storage
- Add rate limiting on login attempts
- Log all authentication events
- Implement proper session management

---

### 6. No Input Validation on Server-Side
**Severity: HIGH**
**Files:**
- `/home/user/electrical-cbt/src/services/googleSheetsService.ts` (lines 25-53)
- `/home/user/electrical-cbt/src/services/supabaseService.ts` (lines 440-474)
- PDF server: `/home/user/electrical-cbt/pdf-server.cjs` (lines 51-60)

**Findings:**
```typescript
// pdf-server.cjs - No path validation
app.get('/api/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'source', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filePath);  // No validation of filename!
});
```

**Issues:**
- Path traversal vulnerability: `/api/pdf/../../../../etc/passwd`
- No input sanitization on filename parameter
- No type validation for API inputs
- User-controlled data sent directly to database queries (though using parameterized queries, lacking validation layer)

**Impact:**
- Directory traversal attacks
- Arbitrary file disclosure
- Server compromise

**Recommendation:**
- Implement input validation middleware
- Use whitelist-based filename validation
- Validate all types and ranges
- Use dedicated validation library (e.g., `joi`, `zod`)
- Implement server-side validation as the source of truth

---

### 7. CORS Misconfiguration
**Severity: HIGH**
**Files:**
- `/home/user/electrical-cbt/pdf-server.cjs` (line 10)
- `/home/user/electrical-cbt/vite.config.ts` (lines 12-17)

**Findings:**
```javascript
// pdf-server.cjs - Line 10
app.use(cors());  // No configuration - allows all origins!

// vite.config.ts - Lines 12-17
allowedHosts: [
  'localhost',
  '.ngrok-free.app',
  '.ngrok.io',
  '.ngrok.app',
],
```

**Issues:**
- Vite development server allows broad ngrok domains (*.ngrok*.app)
- PDF server allows CORS from any origin
- Enables cross-origin attacks
- Allows credentials to be sent from any domain

**Impact:**
- CSRF attacks
- Cross-site request forgery
- Unauthorized API access from malicious sites
- Data theft

**Recommendation:**
- Configure CORS to allow only specific origins:
  ```javascript
  app.use(cors({
    origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST'],
    optionsSuccessStatus: 200
  }));
  ```
- Restrict ngrok domains to specific deployments
- Remove ngrok from allowedHosts in production

---

## MEDIUM SEVERITY VULNERABILITIES

### 8. Insufficient Data Validation in User Registration
**Severity: MEDIUM**
**Files:**
- `/home/user/electrical-cbt/src/pages/Register.tsx` (lines 26-53)

**Findings:**
```typescript
const validateForm = (): string | null => {
  if (!formData.name.trim()) {
    return '이름을 입력해주세요.';
  }
  if (formData.name.trim().length < 2) {
    return '이름은 2글자 이상이어야 합니다.';
  }
  // Phone validation
  const phoneRegex = /^[0-9-]{10,13}$/;
  if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
    return '올바른 전화번호 형식이 아닙니다.';
  }
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
};
```

**Issues:**
- Client-side validation only (can be bypassed)
- No maximum length validation
- Regex-based email validation is weak
- No real-world email verification (no confirmation email sent)
- No SQL/NoSQL injection prevention checks
- Trimming reduces effectiveness of some validations

**Impact:**
- Invalid or malicious data stored in database
- Email spoofing
- Injection attacks if validation bypassed

**Recommendation:**
- Implement server-side validation for all inputs
- Use proper email validation library
- Add email verification flow
- Implement length limits and type checking
- Sanitize all inputs

---

## ADDITIONAL SECURITY CONCERNS

### 9. No Security Headers
**Severity: MEDIUM**

The application doesn't implement critical security headers:
- No Content-Security-Policy (CSP)
- No X-Frame-Options (clickjacking protection)
- No X-Content-Type-Options (MIME-type sniffing)
- No X-XSS-Protection
- No Referrer-Policy
- No Permissions-Policy

**Recommendation:**
Add security headers to production deployment:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

### 10. No Rate Limiting
**Severity: MEDIUM**

No rate limiting on:
- Admin login attempts (easy brute-force)
- User registration (spam)
- API endpoints (DoS attacks)
- Google Sheets API calls

**Recommendation:**
- Implement rate limiting middleware
- Use packages like `express-rate-limit`
- Limit login attempts to 5 per 15 minutes
- Add exponential backoff for repeated failures

---

## FINDINGS SUMMARY TABLE

| # | Vulnerability | Severity | File(s) | Line(s) |
|---|---|---|---|---|
| 1 | Exposed API Keys | CRITICAL | .env | 1-6 |
| 2 | Hardcoded Admin Password | CRITICAL | Admin.tsx | 62, 270, 1555 |
| 3 | XSS via dangerouslySetInnerHTML | HIGH | LatexRenderer.tsx, MathRenderer.tsx | 128, 60 |
| 4 | Unencrypted localStorage | HIGH | storage.ts | 685-695, entire file |
| 5 | Client-side Auth Only | HIGH | Admin.tsx, Login.tsx | 60-62, 116-150 |
| 6 | No Server Input Validation | HIGH | pdf-server.cjs, googleSheetsService.ts | 51-60, 25-53 |
| 7 | CORS Misconfiguration | HIGH | pdf-server.cjs, vite.config.ts | 10, 12-17 |
| 8 | Weak Data Validation | MEDIUM | Register.tsx | 26-53 |
| 9 | No Security Headers | MEDIUM | Server config | N/A |
| 10 | No Rate Limiting | MEDIUM | All endpoints | N/A |

---

## IMMEDIATE ACTION ITEMS

1. **CRITICAL - Revoke exposed credentials immediately:**
   - Regenerate Supabase anonymous key
   - Reset Google Apps Script endpoint
   - Rotate any other exposed secrets

2. **CRITICAL - Remove .env from git history:**
   ```bash
   git filter-repo --invert-paths --path '.env'
   ```

3. **HIGH - Implement server-side authentication:**
   - Build backend API with proper session management
   - Validate all authentication on server
   - Use JWT or session tokens

4. **HIGH - Encrypt sensitive data:**
   - Implement encryption for localStorage data
   - Or migrate to server-side session storage

5. **HIGH - Fix XSS vulnerabilities:**
   - Remove dangerouslySetInnerHTML
   - Use DOMPurify library
   - Implement CSP headers

6. **HIGH - Configure CORS properly:**
   - Specify allowed origins explicitly
   - Remove wildcard CORS

---

## LONG-TERM RECOMMENDATIONS

1. Conduct regular security audits
2. Implement automated security scanning (ESLint security plugins, OWASP ZAP)
3. Use environment variable management system
4. Implement comprehensive logging and monitoring
5. Add security testing to CI/CD pipeline
6. Consider security certifications (OWASP Top 10 compliance)
7. Implement API rate limiting and authentication
8. Regular dependency updates and vulnerability scanning

---

**Report Generated:** 2025-11-17
**Severity Distribution:** 2 CRITICAL, 5 HIGH, 3 MEDIUM

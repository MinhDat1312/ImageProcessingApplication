# Auth UI + Post-login Design

**Date:** 2026-05-08  
**Branch:** feat/Auth-UI-Implement  
**Stack:** React 19 + TypeScript + Vite + Ant Design 6 + Axios + Framer Motion

---

## 1. Scope

Build Auth UI (Login, Register, Email Verify) and integrate with the Spring Boot backend auth APIs. Add post-login user section: header dropdown + My Images gallery page.

---

## 2. Backend APIs (reference)

Base: `http://localhost:8080/api/v1/auth`

| Method | Path | Purpose | Auth required |
|--------|------|---------|---------------|
| POST | `/register` | Đăng ký → gửi email verify | No |
| POST | `/login` | Đăng nhập → set HttpOnly cookies | No |
| GET | `/refresh` | Refresh access token via cookie | No |
| POST | `/logout` | Logout → clear cookies | Yes (cookie) |
| GET | `/users` | Lấy thông tin user hiện tại | Yes (cookie) |
| POST | `/verify` | Xác thực email bằng OTP 6 số | No |
| POST | `/resend?email=` | Gửi lại OTP | No |

Image API: `http://localhost:8080/api/images`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/process` | Xử lý ảnh (multipart) |
| GET | `/mine?page=0&size=9` | Lấy ảnh của user (paginated) |

**Token config:** Access token 5 min, Refresh token 7 days, OTP 15 min.  
Auth transport: HttpOnly cookies (`accessToken` + `refreshToken`) — FE không lưu token ở localStorage.

---

## 3. Architecture

### 3.1 New file structure

```
frontend/src/
├── api/
│   └── axiosInstance.ts        # Shared Axios instance, withCredentials, interceptors
├── context/
│   └── AuthContext.tsx          # AuthContext, AuthProvider, useAuth hook
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── VerifyPage.tsx
├── components/
│   ├── ProtectedRoute.tsx       # Redirect /login nếu chưa auth
│   ├── UserMenu.tsx             # Header dropdown
│   └── MyImagesPage.tsx         # /my-images gallery
├── types/
│   └── index.ts                 # Thêm AuthUser, LoginResponse, UserResponse types
└── main.tsx                     # Thêm BrowserRouter
```

### 3.2 Routing (react-router-dom)

| Path | Component | Protected |
|------|-----------|-----------|
| `/login` | LoginPage | No — redirect `/` nếu đã login |
| `/register` | RegisterPage | No |
| `/verify` | VerifyPage | No |
| `/` | App (pipeline) | Yes — redirect `/login` nếu chưa login |
| `/my-images` | MyImagesPage | Yes |

### 3.3 AuthContext

```ts
interface AuthState {
  user: LoginResponse | null   // null = chưa login
  isLoading: boolean           // đang check session khi mount
}

// useAuth() exposes:
{ user, isLoading, login, logout, setUser }
```

**Mount flow:**
1. `GET /api/v1/auth/users` → thành công → set user
2. Thất bại → `GET /api/v1/auth/refresh` → thành công → set user
3. Vẫn thất bại → `user = null`

### 3.4 Axios interceptor (silent refresh)

```
Response 401 received
  → call GET /api/v1/auth/refresh
  → success → retry original request
  → fail    → clear user state → redirect /login
```

Tất cả API calls dùng `axiosInstance` với `withCredentials: true`.

---

## 4. UI Design

### 4.1 Auth pages — layout chung

Full-screen centered layout:
- Background: `var(--canvas)` (`#0b1220` dark / `#f3f5f8` light)
- Card: `var(--surface)`, `border: 1px solid var(--border-soft)`, `border-radius: 14px`, shadow
- Max width: 380px

Header (sticky, giống app hiện tại) hiển thị trên mọi page — chỉ có logo, không có user menu khi chưa login.

### 4.2 LoginPage `/login`

Fields:
- Email — `Input`, validate: required + email format
- Password — `Input.Password` với show/hide toggle

Validation:
- Submit → Ant Design Form validation trước
- Border đỏ + message lỗi inline khi field không hợp lệ
- Border xanh khi hợp lệ

Server error handling:
- Generic error (sai pw, không tìm thấy) → `notification.error` hoặc inline alert đỏ
- Tài khoản chưa verify → alert vàng + link redirect `/verify?email=`

Success → `setUser(loginResponse)` → navigate `/`

### 4.3 RegisterPage `/register`

Fields:
- Tên hiển thị — required
- Email — required + email format
- Mật khẩu — `Input.Password` + live rules checklist (4 rules: length, uppercase, digit, special char)
- Xác nhận mật khẩu — `Input.Password`, validate khớp với password
- Giới tính — `Select`: Nam / Nữ / Khác

Password rules checklist (live khi đang nhập):
- ✔ xanh khi pass / ✕ đỏ khi chưa pass
- Rules: ≥8 ký tự, có chữ hoa+thường, có số, có ký tự đặc biệt

Submit button: disabled khi form chưa hợp lệ.

Success → navigate `/verify?email=<email>`

### 4.4 VerifyPage `/verify?email=`

- Hiển thị email từ query param
- 6-ô OTP input (Ant Design `Input.OTP`)
- Countdown timer "Mã hết hạn sau MM:SS" (15 phút)
- Nút "Xác thực tài khoản"
- Nút "Gửi lại" với cooldown 60s (disabled + đếm ngược)
- Link "← Quay về đăng nhập"

Success → `notification.success` → navigate `/login`

### 4.5 UserMenu — header dropdown

Thay `ThemeToggle` đứng một mình → thêm `UserMenu` bên trái theme toggle.

Trigger: avatar (initials từ username) + tên + caret `▾`

Dropdown items:
```
[Avatar] ThinhVinh
         thinh@gmail.com
         [USER]
─────────────────
🖼  My Images
─────────────────
🚪  Đăng xuất  (màu đỏ)
```

Logout → `POST /logout` → clear user context → navigate `/login`

### 4.6 MyImagesPage `/my-images`

- Tiêu đề "Ảnh của tôi" + tổng số ảnh
- Grid 3 cột (responsive: 2 cột ≤768px, 1 cột ≤480px)
- Mỗi item: thumbnail + timestamp tương đối
- Pagination (dùng Ant Design `Pagination`, page size 9)
- Empty state khi chưa có ảnh
- Loading skeleton khi fetch

API: `GET /api/images/mine?page=0&size=9`

---

## 5. Types to add (`types/index.ts`)

```ts
export interface LoginResponse {
  userId: string
  username: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  avatar: string
  enabled: boolean
  role: { roleId: string; name: string }
}

export interface UserResponse extends LoginResponse {
  createdAt: string
  updatedAt: string
}

export interface ImageItem {
  id: string
  url: string
  createdAt: string
}
```

---

## 6. Dependencies to install

```bash
npm install react-router-dom
npm install --save-dev @types/react-router-dom
```

---

## 7. Error handling summary

| Scenario | Handling |
|----------|---------|
| Form validation fail | Inline field error (Ant Design Form) |
| Login: sai credentials | Alert đỏ inline dưới form |
| Login: chưa verify | Alert vàng + link → /verify |
| Register: email đã tồn tại | Alert đỏ inline |
| API 401 (access expired) | Interceptor tự refresh → retry |
| Refresh token expired | Clear user → redirect /login |
| Network error | `notification.error` |
| OTP sai/hết hạn | Alert đỏ inline trên VerifyPage |

---

## 8. Out of scope

- Forgot password / reset password (BE chưa có API)
- OAuth / social login (BE có Spring OAuth2 nhưng chưa expose endpoint)
- Profile edit page
- Delete image (BE endpoint đang commented out)

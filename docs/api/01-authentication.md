# Authentication API

All endpoints under `/api/auth`.

---

## POST /api/auth/login

Authenticate a user and receive a Sanctum token.

**Public** – No `Authorization` header required.

### Request Body
```json
{
  "email": "cashier@example.com",
  "password": "secret123"
}
```

### Response `200`
```json
{
  "token": "1|abcdefghijk...",
  "user": {
    "id": 1,
    "name": "John Cashier",
    "email": "cashier@example.com",
    "roles": ["cashier"]
  }
}
```

### Error `422`
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

---

## POST /api/auth/logout

Revoke the current access token.

**Requires auth.**

### Response `200`
```json
{
  "message": "Logged out successfully."
}
```

---

## GET /api/auth/me

Get the currently authenticated user with roles and permissions.

**Requires auth.**

### Response `200`
```json
{
  "id": 1,
  "name": "John Cashier",
  "email": "cashier@example.com",
  "roles": ["cashier"],
  "permissions": ["create_orders", "view_products"]
}
```

---

## PUT /api/auth/profile

Update the authenticated user's name, email, or phone.

**Requires auth.**

### Request Body (all fields optional)
```json
{
  "name": "John Updated",
  "email": "new@example.com",
  "phone": "+6281234567890"
}
```

### Response `200`
```json
{
  "id": 1,
  "name": "John Updated",
  "email": "new@example.com",
  "phone": "+6281234567890"
}
```

---

## PUT /api/auth/password

Change the authenticated user's password.

**Requires auth.**

### Request Body
```json
{
  "current_password": "oldpassword",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

### Response `200`
```json
{
  "message": "Password changed successfully."
}
```

### Error `422`
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "current_password": ["The password is incorrect."]
  }
}
```

---

## Notes

- Tokens are **Bearer tokens** – store them securely using `expo-secure-store` or `@react-native-async-storage/async-storage` with encryption.
- After login, store `token` and `user` in your app state (Redux / Zustand).
- On `401 Unauthenticated` response, redirect the user to the Login screen and clear the stored token.

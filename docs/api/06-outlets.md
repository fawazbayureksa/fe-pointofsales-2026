# Outlets API

All endpoints under `/api/outlets`. **Requires auth.**

Outlets are read-only from the mobile client. Management is done via the web admin.

---

## GET /api/outlets

List all active outlets.

### Query Parameters
| Parameter  | Type    | Description |
|------------|---------|-------------|
| `search`   | string  | Search by name or code |
| `all`      | boolean | Return all without pagination |
| `per_page` | integer | Items per page (default: 20) |
| `page`     | integer | Page number |

### Response `200`
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "name": "Main Store",
      "code": "MAIN-A1B2",
      "phone": "+6221123456",
      "email": "main@example.com",
      "address": "Jl. Sudirman No. 1",
      "city": "Jakarta",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ],
  "total": 3
}
```

**Tip:** Use `?all=true` at app startup to load all outlets for the outlet selector.

---

## GET /api/outlets/{id}

Get a single outlet with assigned users.

### Response `200`
```json
{
  "id": 1,
  "name": "Main Store",
  "code": "MAIN-A1B2",
  "phone": "+6221123456",
  "email": "main@example.com",
  "address": "Jl. Sudirman No. 1",
  "city": "Jakarta",
  "is_active": true,
  "users": [
    {
      "id": 1,
      "name": "John Cashier",
      "email": "john@example.com",
      "pivot": { "is_default": true }
    }
  ]
}
```

---

## Notes

- Each user may have a **default outlet** (`pivot.is_default = true`).
- After login, call `GET /api/auth/me` and then `GET /api/outlets?all=true` to determine which outlet the cashier should default to.
- `outlet_id` is required when creating orders.

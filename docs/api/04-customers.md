# Customers API

All endpoints under `/api/customers`. **Requires auth.**

---

## GET /api/customers

List customers with optional search.

### Query Parameters
| Parameter  | Type    | Description |
|------------|---------|-------------|
| `search`   | string  | Search by name, email, or phone |
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
      "name": "Ahmad Santoso",
      "email": "ahmad@example.com",
      "phone": "+628123456789",
      "address": "Jl. Merdeka No. 1",
      "loyalty_points": 150,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ],
  "total": 25
}
```

**Tip:** Use `?all=true&search=ahmad` to fetch search results without pagination for quick lookup during checkout.

---

## GET /api/customers/{id}

Get a single customer with order history.

### Response `200`
```json
{
  "id": 1,
  "name": "Ahmad Santoso",
  "email": "ahmad@example.com",
  "phone": "+628123456789",
  "address": "Jl. Merdeka No. 1",
  "loyalty_points": 150,
  "is_active": true,
  "orders": [
    {
      "id": 10,
      "order_number": "TEN-20240301-0001",
      "status": "completed",
      "total_amount": "75000.00"
    }
  ]
}
```

---

## POST /api/customers

Create a new customer.

### Request Body
```json
{
  "name": "Budi Setiawan",
  "email": "budi@example.com",
  "phone": "+628987654321",
  "address": "Jl. Sudirman No. 5"
}
```

### Required Fields
- `name` (string)

### Response `201`
Returns the created customer object.

---

## PUT /api/customers/{id}

Update a customer. All fields are optional.

### Request Body
```json
{
  "name": "Budi Updated",
  "phone": "+628000000001"
}
```

### Response `200`
Returns the updated customer object.

---

## DELETE /api/customers/{id}

Soft-delete a customer.

### Response `204`
No content.

---

## Notes

- `loyalty_points` is managed server-side; it cannot be set via the API directly.
- Customers can be attached to orders via the `customer_id` field when creating an order.

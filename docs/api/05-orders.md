# Orders API

All endpoints under `/api/orders`. **Requires auth.**

---

## GET /api/orders

List orders with optional filters.

### Query Parameters
| Parameter   | Type    | Description |
|-------------|---------|-------------|
| `status`    | string  | Filter by status: `pending`, `completed`, `cancelled` |
| `outlet_id` | integer | Filter by outlet |
| `date_from` | date    | Filter from date (YYYY-MM-DD) |
| `date_to`   | date    | Filter to date (YYYY-MM-DD) |
| `per_page`  | integer | Items per page (default: 20) |
| `page`      | integer | Page number |

### Response `200`
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "order_number": "TEN-20240301-0001",
      "status": "completed",
      "payment_status": "paid",
      "subtotal": "45000.00",
      "tax_amount": "4950.00",
      "discount_amount": "0.00",
      "total_amount": "49950.00",
      "notes": null,
      "completed_at": "2024-03-01T10:30:00.000000Z",
      "created_at": "2024-03-01T10:25:00.000000Z",
      "cashier": { "id": 1, "name": "John Cashier" },
      "customer": { "id": 1, "name": "Ahmad Santoso" },
      "outlet": { "id": 1, "name": "Main Store" }
    }
  ],
  "total": 100
}
```

---

## GET /api/orders/{id}

Get a single order with all details.

### Response `200`
```json
{
  "id": 1,
  "order_number": "TEN-20240301-0001",
  "status": "completed",
  "payment_status": "paid",
  "subtotal": "45000.00",
  "tax_amount": "4950.00",
  "discount_amount": "0.00",
  "total_amount": "49950.00",
  "notes": null,
  "completed_at": "2024-03-01T10:30:00.000000Z",
  "cashier": { "id": 1, "name": "John Cashier" },
  "customer": { "id": 1, "name": "Ahmad Santoso" },
  "outlet": { "id": 1, "name": "Main Store" },
  "items": [
    {
      "id": 1,
      "product_id": 2,
      "product_name": "Arabica Coffee",
      "product_sku": "COF-001",
      "unit_price": "45000.00",
      "quantity": 1,
      "discount_amount": "0.00",
      "tax_amount": "0.00",
      "subtotal": "45000.00"
    }
  ],
  "payments": [
    {
      "id": 1,
      "payment_method": "cash",
      "amount": "50000.00",
      "change_amount": "50.00",
      "status": "completed",
      "reference_number": null,
      "paid_at": "2024-03-01T10:30:00.000000Z"
    }
  ]
}
```

---

## POST /api/orders

Create a new order (a "cart" that becomes a pending order).

### Request Body
```json
{
  "outlet_id": 1,
  "customer_id": 1,
  "notes": "Extra sugar",
  "items": [
    {
      "product_id": 2,
      "quantity": 2,
      "discount_amount": 0
    },
    {
      "product_id": 5,
      "quantity": 1,
      "discount_amount": 5000
    }
  ]
}
```

### Required Fields
- `outlet_id` (integer, must exist)
- `items` (array, min 1 item)
- `items[].product_id` (integer, must exist)
- `items[].quantity` (numeric, min: 0.001)

### Response `201`
Returns the created order with items, customer, and outlet loaded.

### Error `422` – Insufficient Stock
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "items.2": ["Insufficient stock for 'Arabica Coffee'. Available: 0"]
  }
}
```

---

## POST /api/orders/{id}/pay

Process payment for an order.

### Request Body
```json
{
  "payment_method": "cash",
  "amount": 50000,
  "reference_number": null
}
```

### Payment Methods
- `cash`
- `card`
- `qris`
- `transfer`

### Required Fields
- `payment_method` (string, one of the above)
- `amount` (numeric, must be ≥ outstanding balance)

### Response `200`
```json
{
  "id": 1,
  "order_id": 1,
  "payment_method": "cash",
  "amount": "50000.00",
  "change_amount": "50.00",
  "status": "completed",
  "reference_number": null,
  "paid_at": "2024-03-01T10:30:00.000000Z",
  "order": { ... }
}
```

---

## POST /api/orders/{id}/cancel

Cancel a pending order (restores stock).

### Request Body (optional)
```json
{
  "reason": "Customer changed their mind"
}
```

### Response `200`
Returns the updated order with `status: "cancelled"`.

---

## Order Status Flow

```
pending → [pay] → completed
pending → [cancel] → cancelled
```

- `payment_status`: `unpaid` → `paid`
- Only `pending` orders can be paid or cancelled.

---

## Notes

- The order `total_amount` is automatically calculated from items (subtotal + tax - discount).
- After paying, the order status becomes `completed` and the payment status becomes `paid`.
- Stock is deducted when the order is created (not when paid).

# Products API

All endpoints under `/api/products`. **Requires auth.**

---

## GET /api/products

List products with optional search and filters.

### Query Parameters
| Parameter  | Type    | Description |
|------------|---------|-------------|
| `search`   | string  | Search by name, SKU, or barcode |
| `category` | string  | Filter by category name |
| `outlet_id`| integer | Filter by outlet |
| `per_page` | integer | Items per page (default: 20) |
| `page`     | integer | Page number |

### Response `200`
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "name": "Arabica Coffee",
      "sku": "COF-001",
      "barcode": "8991234567890",
      "description": "Premium arabica coffee beans",
      "category_id": 2,
      "price": "45000.00",
      "cost_price": "30000.00",
      "unit": "pcs",
      "is_active": true,
      "track_stock": true,
      "image": null,
      "created_at": "2024-01-01T00:00:00.000000Z",
      "updated_at": "2024-01-01T00:00:00.000000Z"
    }
  ],
  "per_page": 20,
  "total": 50
}
```

---

## GET /api/products/{id}

Get a single product.

### Response `200`
```json
{
  "id": 1,
  "name": "Arabica Coffee",
  "sku": "COF-001",
  "barcode": "8991234567890",
  "price": "45000.00",
  "cost_price": "30000.00",
  "unit": "pcs",
  "is_active": true,
  "track_stock": true,
  "category_id": 2,
  "image": null
}
```

---

## POST /api/products

Create a new product.

### Request Body
```json
{
  "name": "New Product",
  "sku": "PRD-100",
  "barcode": "1234567890",
  "description": "Description here",
  "category": "Beverages",
  "price": 25000,
  "cost_price": 15000,
  "stock": 100,
  "low_stock_threshold": 10,
  "unit": "pcs",
  "outlet_id": 1,
  "track_stock": true
}
```

### Required Fields
- `name` (string)
- `price` (numeric, min: 0)

### Response `201`
Returns the created product object.

---

## PUT /api/products/{id}

Update a product. All fields are optional.

### Request Body
```json
{
  "name": "Updated Name",
  "price": 30000,
  "stock": 150,
  "is_active": true
}
```

### Response `200`
Returns the updated product object.

---

## DELETE /api/products/{id}

Soft-delete a product.

### Response `204`
No content.

---

## Notes

- Stock is stored per outlet in the `product_outlet` pivot table.
- When `track_stock` is `true`, creating an order will deduct stock automatically.
- The `image` field contains a relative path; prefix with your storage URL to display it.

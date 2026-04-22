# Products API

All endpoints under `/api/products`. **Requires auth.**

---

## GET /api/products

List products with optional search and filters.

### Query Parameters
| Parameter    | Type    | Description |
|--------------|---------|-------------|
| `search`     | string  | Search by name, SKU, or barcode |
| `category`   | string  | Filter by category name (partial match) |
| `category_id`| integer | Filter by category ID |
| `outlet_id`  | integer | Filter by outlet; also returns per-outlet stock |
| `per_page`   | integer | Items per page (default: 20) |
| `page`       | integer | Page number |

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
      "category": "Beverages",
      "price": "45000.00",
      "cost_price": "30000.00",
      "unit": "pcs",
      "is_active": true,
      "track_stock": true,
      "image": "http://example.com/storage/products/abc123.jpg",
      "stock": 50.0
    }
  ],
  "per_page": 20,
  "total": 50
}
```

> `stock` is only populated when `outlet_id` is provided.

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
  "image": "http://example.com/storage/products/abc123.jpg"
}
```

---

## GET /api/products/barcode/{barcode}

Exact-match barcode lookup for scanner hardware.

### Response `200`
Returns the matching product object with `category` and `outlets` relations.

### Response `404`
```json
{ "message": "Product not found." }
```

---

## POST /api/products

Create a new product. Optionally upload an image in the same request.

### Content-Type
`multipart/form-data` (required when uploading an image, otherwise `application/json` is also accepted)

### Request Fields
| Field                | Type    | Required | Description |
|----------------------|---------|----------|-------------|
| `name`               | string  | Yes      | Product name (max 255) |
| `price`              | numeric | Yes      | Selling price (min: 0) |
| `sku`                | string  | No       | Must be unique |
| `barcode`            | string  | No       | Barcode string |
| `description`        | string  | No       | |
| `category_id`        | integer | No       | Existing category ID |
| `category`           | string  | No       | Category name — resolved to `category_id` if the name exists |
| `cost_price`         | numeric | No       | |
| `stock`              | numeric | No       | Initial stock quantity |
| `low_stock_threshold`| numeric | No       | |
| `unit`               | string  | No       | e.g. `pcs`, `kg` |
| `outlet_id`          | integer | No       | Associate with an outlet |
| `track_stock`        | boolean | No       | Default: `true` |
| `image`              | file    | No       | jpeg/png/webp, max 2 MB |

### Response `201`
Returns the created product object. `image` is a full public URL.

```json
{
  "id": 5,
  "name": "New Product",
  "price": "25000.00",
  "image": "http://example.com/storage/products/abc123.jpg"
}
```

---

## PUT /api/products/{id}

Update a product. All fields are optional. Send as `multipart/form-data` to replace the image.

### Request Fields
| Field                | Type    | Description |
|----------------------|---------|-------------|
| `name`               | string  | |
| `price`              | numeric | |
| `cost_price`         | numeric | |
| `stock`              | numeric | |
| `low_stock_threshold`| numeric | |
| `category_id`        | integer | |
| `category`           | string  | Resolved to `category_id` if the name exists |
| `is_active`          | boolean | |
| `image`              | file    | jpeg/png/webp, max 2 MB — replaces existing image |

### Response `200`
Returns the updated product object. `image` is a full public URL.

---

## DELETE /api/products/{id}

Soft-delete a product. The associated image file is also removed from storage.

### Response `204`
No content.

---

## POST /api/products/{id}/image

Upload or replace the image of an existing product without modifying other fields.

### Content-Type
`multipart/form-data`

### Request Fields
| Field   | Type | Required | Description |
|---------|------|----------|-------------|
| `image` | file | Yes      | jpeg/png/webp, max 2 MB |

### Response `200`
```json
{
  "image": "http://example.com/storage/products/abc123.jpg"
}
```

---

## Notes

- Stock is stored per outlet in the `product_outlet` pivot table.
- When `track_stock` is `true`, creating an order will deduct stock automatically.
- All `image` fields in responses are full public URLs (e.g. `http://your-domain/storage/products/...`). A `null` value means no image has been uploaded.

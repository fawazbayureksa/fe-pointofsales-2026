# Categories API

All endpoints under `/api/categories`. **Requires auth.**

---

## GET /api/categories

List all active categories.

### Query Parameters
| Parameter    | Type    | Description |
|--------------|---------|-------------|
| `search`     | string  | Filter by name |
| `roots_only` | boolean | Only return root (top-level) categories |
| `all`        | boolean | Return all without pagination |
| `per_page`   | integer | Items per page (default: 20) |
| `page`       | integer | Page number |

### Response `200`
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "name": "Beverages",
      "slug": "beverages",
      "parent_id": null,
      "sort_order": 0,
      "is_active": true,
      "products_count": 12,
      "children": [
        {
          "id": 3,
          "name": "Hot Drinks",
          "slug": "hot-drinks",
          "parent_id": 1
        }
      ]
    }
  ],
  "total": 5
}
```

**Tip:** Use `?all=true` to fetch all categories at once for a category picker dropdown.

---

## GET /api/categories/{id}

Get a single category with parent and children.

### Response `200`
```json
{
  "id": 1,
  "name": "Beverages",
  "slug": "beverages",
  "parent_id": null,
  "sort_order": 0,
  "is_active": true,
  "parent": null,
  "children": [
    { "id": 3, "name": "Hot Drinks" }
  ]
}
```

---

## POST /api/categories

Create a new category.

### Request Body
```json
{
  "name": "Snacks",
  "slug": "snacks",
  "parent_id": null,
  "sort_order": 1,
  "is_active": true
}
```

### Required Fields
- `name` (string)

### Response `201`
Returns the created category object.

---

## PUT /api/categories/{id}

Update a category. All fields are optional.

### Request Body
```json
{
  "name": "Updated Category",
  "sort_order": 2
}
```

### Response `200`
Returns the updated category object.

---

## DELETE /api/categories/{id}

Soft-delete a category.

### Response `204`
No content.

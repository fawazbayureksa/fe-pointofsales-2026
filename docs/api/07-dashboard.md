# Dashboard API

Endpoint: `GET /api/dashboard`. **Requires auth.**

Returns aggregated statistics for the dashboard screen.

---

## GET /api/dashboard

### Response `200`

```json
{
  "sales": {
    "today": 1250000.00,
    "today_growth": 12.5,
    "monthly": 35000000.00,
    "monthly_growth": 8.3,
    "avg_order": 62500.00,
    "last_7_days": [
      { "date": "2024-03-23", "label": "Sat, 23 Mar", "total": 980000 },
      { "date": "2024-03-24", "label": "Sun, 24 Mar", "total": 750000 },
      { "date": "2024-03-25", "label": "Mon, 25 Mar", "total": 1100000 },
      { "date": "2024-03-26", "label": "Tue, 26 Mar", "total": 890000 },
      { "date": "2024-03-27", "label": "Wed, 27 Mar", "total": 1300000 },
      { "date": "2024-03-28", "label": "Thu, 28 Mar", "total": 1110000 },
      { "date": "2024-03-29", "label": "Fri, 29 Mar", "total": 1250000 }
    ]
  },
  "orders": {
    "today": 20,
    "completed": 18,
    "pending": 2
  },
  "outlets": 3,
  "customers": {
    "total": 250,
    "new_this_week": 12
  },
  "top_products": [
    {
      "product_id": 2,
      "product_name": "Arabica Coffee",
      "sold": 45.0,
      "revenue": "2025000.00"
    }
  ],
  "payment_method_stats": [
    { "payment_method": "cash", "count": 15, "total": "750000.00" },
    { "payment_method": "qris", "count": 5, "total": "500000.00" }
  ],
  "low_stock_products": [
    {
      "product_id": 3,
      "name": "Robusta Beans",
      "outlet_name": "Main Store",
      "outlet_id": 1,
      "stock": 5.0,
      "threshold": 10.0
    }
  ],
  "recent_orders": [
    {
      "id": 100,
      "order_number": "TEN-20240329-0020",
      "status": "completed",
      "total_amount": 75000.0,
      "customer": "Ahmad Santoso",
      "outlet": "Main Store",
      "created_at": "2024-03-29T10:30:00.000000Z"
    }
  ]
}
```

---

## Field Reference

### `sales`
| Field | Description |
|-------|-------------|
| `today` | Total revenue today (completed orders) |
| `today_growth` | % change vs yesterday |
| `monthly` | Total revenue this calendar month |
| `monthly_growth` | % change vs last month |
| `avg_order` | Average order value today |
| `last_7_days` | Daily totals for the last 7 days |

### `orders`
| Field | Description |
|-------|-------------|
| `today` | Total orders created today |
| `completed` | Completed orders today |
| `pending` | All currently pending orders |

### `customers`
| Field | Description |
|-------|-------------|
| `total` | All-time customer count |
| `new_this_week` | Customers registered since Monday |

### `low_stock_products`
Products where current stock ≤ low-stock threshold. Up to 10 items returned.

### `recent_orders`
The 8 most recent orders across all statuses.

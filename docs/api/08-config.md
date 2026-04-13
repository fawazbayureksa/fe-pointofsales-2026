# Configuration API

All endpoints under `/api/config`. **Requires auth.**

Tenant-level configuration settings such as currency, tax rate, and receipt footer.

---

## GET /api/config

Return all configuration keys and their current values.

### Response `200`
```json
{
  "currency": "IDR",
  "tax_rate": "11",
  "receipt_footer": "Thank you for your purchase!",
  "timezone": "Asia/Jakarta",
  "date_format": "d/m/Y",
  "low_stock_alert": "true"
}
```

---

## GET /api/config/{key}

Return a single configuration value.

### Example: `GET /api/config/tax_rate`

### Response `200`
```json
{
  "key": "tax_rate",
  "value": "11"
}
```

---

## PUT /api/config/{key}

Update a configuration value.

### Request Body
```json
{
  "value": "12",
  "type": "integer"
}
```

### `type` Options
| Type      | Description |
|-----------|-------------|
| `string`  | Default – plain text |
| `integer` | Stored and returned as integer |
| `boolean` | Stored as `true`/`false` string, returned as boolean |
| `json`    | Stored and returned as JSON |

### Response `200`
```json
{
  "key": "tax_rate",
  "value": 12
}
```

---

## Default Keys

| Key | Default | Description |
|-----|---------|-------------|
| `currency` | `IDR` | Currency code |
| `tax_rate` | `11` | Tax percentage |
| `receipt_footer` | `Thank you for your purchase!` | Receipt footer text |
| `timezone` | `Asia/Jakarta` | App timezone |
| `date_format` | `d/m/Y` | Date display format |
| `low_stock_alert` | `true` | Enable low-stock notifications |

---

## Notes

- Fetch config at app startup to apply currency formatting, tax calculations, and receipt customisation.
- Cache the config in your app state; re-fetch when the user navigates to Settings.

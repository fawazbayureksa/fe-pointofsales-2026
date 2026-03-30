# Point of Sales – API Documentation

## Overview

This folder contains the complete API reference for the **Point of Sales 2026** backend, built with **Laravel 11** and **Laravel Sanctum** for token-based authentication.

It is organised per feature so each section can be read independently when building a React Native frontend.

---

## Base URL

```
https://<your-domain>/api
```

All requests must include:

```
Accept: application/json
Content-Type: application/json
```

Authenticated requests must also include:

```
Authorization: Bearer <token>
```

---

## Response Format

### Success
```json
{
  "data": { ... }
}
```
Paginated responses follow Laravel's default pagination envelope:
```json
{
  "current_page": 1,
  "data": [...],
  "per_page": 20,
  "total": 100,
  "last_page": 5,
  "next_page_url": "...",
  "prev_page_url": null
}
```

### Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Validation message"]
  }
}
```

HTTP status codes follow REST conventions:
| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 204  | No Content (delete) |
| 401  | Unauthenticated |
| 403  | Forbidden |
| 422  | Validation Error |
| 500  | Server Error |

---

## Documentation Index

| File | Feature |
|------|---------|
| [01-authentication.md](./01-authentication.md) | Login, Logout, Profile, Password |
| [02-products.md](./02-products.md) | Product CRUD + search |
| [03-categories.md](./03-categories.md) | Category CRUD |
| [04-customers.md](./04-customers.md) | Customer CRUD |
| [05-orders.md](./05-orders.md) | Orders, Payments, Cancel |
| [06-outlets.md](./06-outlets.md) | Outlets (read-only) |
| [07-dashboard.md](./07-dashboard.md) | Dashboard stats |
| [08-config.md](./08-config.md) | Tenant configuration |

---

## React Native Implementation Prompts

See the [`../frontend/`](../frontend/) folder for per-feature React Native implementation prompts.

| File | Feature |
|------|---------|
| [00-setup.md](../frontend/00-setup.md) | Project setup & API client |
| [01-authentication.md](../frontend/01-authentication.md) | Auth screens & token storage |
| [02-products.md](../frontend/02-products.md) | Product list & management screens |
| [03-categories.md](../frontend/03-categories.md) | Category picker screen |
| [04-customers.md](../frontend/04-customers.md) | Customer management screens |
| [05-orders.md](../frontend/05-orders.md) | POS checkout & order history |
| [06-outlets.md](../frontend/06-outlets.md) | Outlet selector |
| [07-dashboard.md](../frontend/07-dashboard.md) | Dashboard screen |
| [08-config.md](../frontend/08-config.md) | Settings screen |

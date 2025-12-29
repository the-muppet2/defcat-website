# API Reference

DefCat DeckVault API Overview

## Authentication

Most API endpoints require authentication through Patreon OAuth. Users log in via Patreon and receive a session that authenticates subsequent requests.

### Role-Based Access

Endpoints are protected by role hierarchy:
- **User** - Basic authenticated user
- **Member** - Patreon subscriber
- **Moderator** - Content moderator
- **Admin** - Administrator

---

## Public Endpoints

### Health Check

**GET /api/health**

Check API health status and service availability. Returns status of database, auth, and storage services.

### Card Image Proxy

**GET /api/card-image**

Retrieve Magic card images with caching.

Parameters:
- `name` - Card name (required)
- `size` - Image size: `png`, `art`, `lg`, `md`, `sm` (default: `art`)
- `face` - Card face: `front`, `back` (default: `front`)

---

## Submission Endpoints

### Submit Deck

**POST /api/submit-deck**

Submit a deck for review and approval. Requires authentication and available deck credits.

Fields:
- `moxfield_url` - Valid Moxfield deck URL
- `email` - Contact email address
- `bracket` - Deck bracket: `bracket1` through `bracket5`, `cedh`, `wild`
- `comments` - Additional comments (optional)

### Submit Roast Request

**POST /api/submit-roast**

Request a deck critique ("roast"). Requires authentication and available roast credits.

Fields:
- `moxfield_url` - Valid Moxfield deck URL
- `email` - Contact email address
- `comments` - Special requests (optional)

---

## Admin Endpoints

Admin endpoints require authentication with Admin or Moderator role.

### User Management

- **GET /api/admin/users** - List users with pagination
- **POST /api/admin/users/add** - Create new user account
- **POST /api/admin/users/update-role** - Change user role

### Submission Management

- **GET /api/admin/submissions** - List submissions with filtering
- **PATCH /api/admin/submissions/{id}** - Approve or reject submission

### Deck Management

- **POST /api/admin/decks/import** - Bulk import decks from Moxfield

### Product Management

- **GET /api/admin/products** - List all products
- **POST /api/admin/products** - Create new product

### Site Configuration

- **GET /api/admin/site-config** - Get all site configuration
- **POST /api/admin/site-config/add** - Add configuration item
- **PUT /api/admin/site-config/{key}** - Update configuration
- **DELETE /api/admin/site-config/{key}** - Delete configuration

---

## Error Handling

All endpoints return consistent error responses with:
- `success` - Boolean indicating success/failure
- `error.message` - Human-readable error message
- `error.code` - Error code for programmatic handling

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Public endpoints:** 60 requests per minute
- **Authenticated endpoints:** 120 requests per minute
- **Admin endpoints:** 300 requests per minute

When rate limit is exceeded, wait for the retry period before making additional requests.

---

**Last Updated:** 2025-11-15

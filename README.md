# React + Vite

## API

The app uses the REST client in `src/api/api.js`. Relative routes are fetched as declared; the Properties map currently uses its configured Postman endpoint.

Without a reachable API, the app keeps its built-in demo data and local optimistic actions as a fallback.

The frontend uses these routes (all JSON responses may be returned directly or wrapped in `data`):

| Method | Route | Use |
| --- | --- | --- |
| GET | `/workspace`, `/employees`, `/leads`, `/bookings`, `/meetings` | Load workspace data after sign-in |
| GET | `/properties?offset=0&limit=20` | Load paginated property summaries for the index; index scrolling requests the next offset |
| GET | `/properties?north=...&south=...&east=...&west=...&zoom=...` | Load property markers in the current map viewport without pagination parameters |
| GET | `/properties/:id` | Load full details for one property when its detail view is opened |
| POST | `/auth/signin`, `/auth/signup` | Authenticate or create an account; responses may include `user`/`account` and `token`/`accessToken` |
| POST | `/auth/signout` | End the current session |
| POST/PATCH | `/workspace`, `/properties`, `/properties/:id`, `/properties/:id/assignment` | Create or update workspace and properties |
| POST/PATCH | `/leads`, `/leads/:id`, `/leads/:id/assignment` | Create or update leads and assignments |
| POST | `/bookings`, `/meetings` | Create bookings and meetings |
| GET/POST | `/leads/:id/messages` | Read and create lead conversation messages |
| GET/POST | `/leads/:id/calls` | Read and create call logs |
| POST | `/uploads` | Upload one multipart file using the `file` field; return its durable `url` |

Message records use `sender`, `text`, and `attachments`; call records use `phone`, `notes`, `startedAt`, and `endedAt`. Upload responses should return `{ url, name }` directly or inside `data`/`file`.

The paginated Properties endpoint should return a page and its pagination metadata:

```json
{
	"data": {
		"items": [{ "id": "property-123", "name": "The Somerset", "coordinates": [13.0012, 80.2565], "units": ["A-101"], "media": [] }],
		"pagination": { "offset": 0, "limit": 20, "total": 60, "hasMore": true }
	}
}
```

The map lookup should return the properties in the requested bounds as an array or as an `items` array, without pagination metadata. Catalog requests use only `offset` and `limit`; map requests use only bounds and `zoom`.

### Dashboard GET response bodies

These are the canonical wrapped responses consumed by the sales and admin dashboards. The client also accepts the corresponding payload directly, without the outer `data` property.

`GET /workspace`

```json
{
	"data": {
		"workspace": {
			"name": "Manju Groups",
			"location": "Chennai portfolio",
			"owner": "Priya Shah"
		}
	}
}
```

`GET /employees`

```json
{
	"data": {
		"employees": [
			{
				"id": "employee-priya",
				"name": "Priya Shah",
				"email": "priya@manjugroups.com",
				"role": "employee",
				"initials": "PS",
				"title": "Senior Property Advisor"
			}
		]
	}
}
```

`GET /properties?offset=0&limit=20`

```json
{
	"data": {
		"items": [
			{
				"id": "property-the-somerset",
				"name": "The Somerset",
				"location": "Adyar, Chennai",
				"type": "Residential",
				"status": "Limited",
				"price": "₹1.18 Cr",
				"units": ["B-302", "B-401", "C-105"],
				"coordinates": [13.0012, 80.2565],
				"imageUrl": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
				"assignedTo": "employee-priya"
			}
		],
		"pagination": {
			"offset": 0,
			"limit": 20,
			"total": 1,
			"hasMore": false
		}
	}
}
```

`GET /leads`

```json
{
	"data": {
		"leads": [
			{
				"id": "lead-karthik",
				"name": "Karthik Subramanian",
				"email": "karthik@example.com",
				"phone": "+91 98401 23456",
				"property": "The Somerset",
				"propertyId": "property-the-somerset",
				"stage": "Interested",
				"unit": "B-302",
				"budget": "₹1.2 Cr",
				"assignedTo": "employee-priya",
				"createdAt": "2026-09-22T09:30:00.000Z"
			}
		]
	}
}
```

`GET /bookings`

```json
{
	"data": {
		"bookings": [
			{
				"id": "booking-1",
				"property": "The Somerset",
				"propertyId": "property-the-somerset",
				"lead": "Karthik Subramanian",
				"leadId": "lead-karthik",
				"unit": "B-302",
				"amount": "₹1.18 Cr",
				"status": "Reserved",
				"createdAt": "2026-09-22T10:00:00.000Z"
			}
		]
	}
}
```

`GET /meetings`

```json
{
	"data": {
		"meetings": [
			{
				"id": "meeting-1",
				"leadId": "lead-karthik",
				"lead": "Karthik Subramanian",
				"property": "The Somerset",
				"date": "2026-09-26",
				"time": "11:30",
				"type": "Site visit",
				"notes": "Review the available layouts."
			}
		]
	}
}
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

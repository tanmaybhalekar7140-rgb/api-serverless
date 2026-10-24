# Serverless Task API

A serverless REST API for task records, built with Node.js and deployed as a Vercel Function. It was built for the CodeNova Cloud Computing internship, Task 3.

**Live API:** https://YOUR-PROJECT.vercel.app/api/tasks
**Repository:** https://github.com/tanmaybhalekar7140-rgb/task-api-serverless

## Features
- Create, fetch and update task records with JSON payloads
- Request validation with clear error messages
- CORS headers, including preflight (OPTIONS) handling
- Standard HTTP status codes
- Configuration as code in `vercel.json`
- No dependencies, so cold starts stay fast

## Project structure
```
api/tasks.js   serverless function with all routes
vercel.json    routing, CORS-friendly config and function settings
README.md      documentation
```

## Task object
| Field | Type | Rules |
|---|---|---|
| id | string | set by the server |
| title | string | required, 1 to 100 characters |
| description | string | optional, up to 500 characters |
| status | string | `todo`, `in-progress` or `done` (default `todo`) |
| createdAt, updatedAt | string | ISO timestamps set by the server |

## Endpoints
| Method | Path | Description | Success code |
|---|---|---|---|
| GET | /api/tasks | List all tasks (optional `?status=done`) | 200 |
| GET | /api/tasks/:id | Fetch one task | 200 |
| POST | /api/tasks | Create a task | 201 |
| PUT or PATCH | /api/tasks/:id | Update a task (any of the fields) | 200 |
| OPTIONS | any | CORS preflight | 204 |

Error codes: `400` invalid or malformed payload, `404` task not found, `405` method not allowed, `500` server error.

Every response has this shape:
```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": 400, "message": "Validation failed", "details": ["title is required"] } }
```

## curl examples
Replace the URL with your own.

```bash
BASE=https://YOUR-PROJECT.vercel.app

# list tasks
curl $BASE/api/tasks

# fetch one task
curl $BASE/api/tasks/1

# create a task (201)
curl -X POST $BASE/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Write README","status":"todo"}'

# update a task (200)
curl -X PUT $BASE/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'

# invalid payload (400)
curl -X POST $BASE/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"status":"wrong"}'

# malformed JSON (400)
curl -X POST $BASE/api/tasks \
  -H "Content-Type: application/json" \
  -d '{bad json'

# CORS preflight (204)
curl -i -X OPTIONS $BASE/api/tasks \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"
```

## Deployment steps
1. Create a public GitHub repository and upload the files in this project.
2. Sign in to Vercel with GitHub, then choose Add New, Project, and import the repository.
3. Keep the Framework Preset as Other, with no build command, and click Deploy.
4. Under Settings, Deployment Protection, disable Vercel Authentication so the API is public.
5. Open `/api/tasks` on the deployment URL to check it works.

Every push to `main` redeploys the API automatically.

## Design notes
- **Cold starts:** the function has no dependencies and does no setup work, so it responds quickly after a cold start.
- **Storage:** tasks are kept in memory for this task, so they reset when the function restarts. Two sample tasks are added at start-up. A real project would use a database such as DynamoDB or Vercel KV.
- **CORS:** `Access-Control-Allow-Origin: *` lets any browser app call the API.

## Screenshots
![GET tasks](screenshots/get-tasks.png)
![POST task, 201](screenshots/post-201.png)
![Validation error, 400](screenshots/error-400.png)
![Vercel dashboard](screenshots/vercel.png)

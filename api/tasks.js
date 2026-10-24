// Serverless Task API (Vercel Function, Node.js)
// Routes: GET /api/tasks, GET /api/tasks/:id, POST /api/tasks, PUT|PATCH /api/tasks/:id
// Data is kept in memory, so it resets when the function cold-starts. Two sample tasks are re-seeded each time.

const STATUSES = ['todo', 'in-progress', 'done'];
const FIELDS = ['title', 'description', 'status'];
const tasks = new Map();
let nextId = 1;

function addTask(data) {
  const now = new Date().toISOString();
  const task = { id: String(nextId++), title: data.title, description: data.description || '', status: data.status || 'todo', createdAt: now, updatedAt: now };
  tasks.set(task.id, task);
  return task;
}
addTask({ title: 'Deploy static website', status: 'done' });
addTask({ title: 'Build serverless Task API', description: 'Task 3 for CodeNova', status: 'in-progress' });

function send(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
const ok = (res, code, data) => send(res, code, { success: true, data });
const fail = (res, code, message, details) => send(res, code, { success: false, error: { code, message, details } });

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function validate(payload, requireTitle) {
  const errors = [];
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['Body must be a JSON object'] };
  }
  for (const key of Object.keys(payload)) {
    if (!FIELDS.includes(key)) errors.push(`Unknown field: ${key}`);
  }
  const { title, description, status } = payload;
  if (title === undefined) {
    if (requireTitle) errors.push('title is required');
  } else if (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 100) {
    errors.push('title must be a string of 1 to 100 characters');
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
    errors.push('description must be a string of up to 500 characters');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(', ')}`);
  }
  if (!requireTitle && Object.keys(payload).filter((k) => FIELDS.includes(k)).length === 0 && errors.length === 0) {
    errors.push('Provide at least one field to update');
  }
  return { errors };
}

module.exports = (req, res) => {
  try {
    cors(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const url = new URL(req.url, 'http://localhost');
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      if (id) {
        const task = tasks.get(id);
        return task ? ok(res, 200, task) : fail(res, 404, `Task ${id} not found`);
      }
      let list = [...tasks.values()];
      const status = url.searchParams.get('status');
      if (status) {
        if (!STATUSES.includes(status)) return fail(res, 400, `status must be one of: ${STATUSES.join(', ')}`);
        list = list.filter((t) => t.status === status);
      }
      return ok(res, 200, list);
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      let body;
      try {
        body = req.body;
      } catch (e) {
        return fail(res, 400, 'Malformed JSON in request body');
      }
      if (body === undefined || body === '') return fail(res, 400, 'JSON body is required');

      if (req.method === 'POST') {
        if (id) return fail(res, 405, 'Use PUT to update an existing task');
        const { errors } = validate(body, true);
        if (errors.length) return fail(res, 400, 'Validation failed', errors);
        const task = addTask({ ...body, title: body.title.trim() });
        return ok(res, 201, task);
      }

      if (!id) return fail(res, 400, 'Task id is required, use /api/tasks/:id');
      const task = tasks.get(id);
      if (!task) return fail(res, 404, `Task ${id} not found`);
      const { errors } = validate(body, false);
      if (errors.length) return fail(res, 400, 'Validation failed', errors);
      if (body.title !== undefined) task.title = body.title.trim();
      if (body.description !== undefined) task.description = body.description;
      if (body.status !== undefined) task.status = body.status;
      task.updatedAt = new Date().toISOString();
      return ok(res, 200, task);
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, OPTIONS');
    return fail(res, 405, `Method ${req.method} not allowed`);
  } catch (err) {
    return fail(res, 500, 'Internal server error');
  }
};

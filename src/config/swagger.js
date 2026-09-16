const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ThreadFlow API',
    version: '1.0.0',
    description: 'Fashion studio ops — owner auth, staff PIN login, roster',
  },
  servers: [
    {
      url: process.env.SERVER_URL || 'http://localhost:5000',
      description: process.env.SERVER_URL ? 'Production' : 'Local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
    paths: {
    '/api/auth/owner/register': {
      post: {
        tags: ['Auth — Owner'],
        summary: 'Register owner + create studio',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'studioName'],
                properties: {
                  name: { type: 'string', example: 'Ada Owner' },
                  email: { type: 'string', example: 'ada@studio.com' },
                  password: { type: 'string', example: 'secret12' },
                  studioName: { type: 'string', example: 'Ada Atelier' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Bad request' },
        },
      },
    },
    '/api/auth/owner/login': {
      post: {
        tags: ['Auth — Owner'],
        summary: 'Owner login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/owner/me': {
      get: {
        tags: ['Auth — Owner'],
        summary: 'Current owner',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/staff/login': {
      post: {
        tags: ['Auth — Staff'],
        summary: 'Staff PIN login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studioCode', 'name', 'pin'],
                properties: {
                  studioCode: { type: 'string' },
                  name: { type: 'string' },
                  pin: { type: 'string', example: '4821' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/staff/me': {
      get: {
        tags: ['Auth — Staff'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/staff': {
      get: {
        tags: ['Staff roster'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List' } },
      },
      post: {
        tags: ['Staff roster'],
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },

    // ===== ORDERS & STEPS (add these) =====
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order + auto-assign steps (owner)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['clientName', 'itemDescription', 'deadline'],
                properties: {
                  clientName: { type: 'string', example: 'Chioma Okeke' },
                  itemDescription: {
                    type: 'string',
                    example: 'Agbada — navy, embroidery',
                  },
                  deadline: {
                    type: 'string',
                    format: 'date',
                    example: '2026-09-25',
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Order + steps created' } },
      },
      get: {
        tags: ['Orders'],
        summary: 'List orders (owner)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Order detail + steps (owner)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/steps/mine': {
      get: {
        tags: ['Steps'],
        summary: 'My open steps (staff)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/steps/{id}/complete': {
      patch: {
        tags: ['Steps'],
        summary: 'Mark step done (staff)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 200: { description: 'Completed' } },
      },
    },
    '/api/reports/speed': {
  get: {
    tags: ['Reports'],
    summary: 'Speed report + bottlenecks (owner)',
    description:
      'Averages per step type, per staff, per order, plus bottleneck flags and current workload',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Speed report' },
      401: { description: 'Unauthorized' },
      403: { description: 'Owners only' },
    },
  },
},
  },
};

module.exports = swaggerSpec;
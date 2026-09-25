const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ThreadFlow API',
    version: '1.0.0',
    description:
      'Fashion studio ops — owner auth, staff PIN login, roster, orders, steps, reports, Swift Agent',
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

    // ===== ORDERS & STEPS =====
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
    '/api/orders/{id}/assign': {
      post: {
        tags: ['Orders', 'Agent'],
        summary: 'Re-run step assignment agent for an order (owner)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string' },
            description: 'Order ID',
          },
        ],
        responses: {
          200: { description: 'Steps reassigned' },
          404: { description: 'Order not found' },
        },
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

    // ===== SWIFT AGENT =====
    '/api/owner/ops-brief': {
      get: {
        tags: ['Agent'],
        summary: 'Owner ops brief (for Swift Agent / dashboard)',
        description:
          'Short operational summary: open/overdue orders, slowest step, busiest staff',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Ops brief',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: {
                      type: 'string',
                      example:
                        'Ada Atelier: 7 open orders. 2 overdue. Slowest step: Finishing (avg 2.1 days). Busiest: Tunde (5 tasks).',
                    },
                    openOrders: { type: 'integer', example: 7 },
                    overdueOrders: { type: 'integer', example: 2 },
                    slowestStep: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        name: { type: 'string', example: 'Finishing' },
                        avgDays: { type: 'number', example: 2.1 },
                      },
                    },
                    busiestStaff: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        name: { type: 'string', example: 'Tunde' },
                        tasks: { type: 'integer', example: 5 },
                      },
                    },
                    freestStaff: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        name: { type: 'string', example: 'Bola' },
                        tasks: { type: 'integer', example: 1 },
                      },
                    },
                    generatedAt: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Owners only' },
        },
      },
    },
    '/api/owner/agent/config': {
      get: {
        tags: ['Agent'],
        summary: 'Swift Agent widget config (owner only)',
        description:
          'Returns companyId, apiKey, and widgetSrc so the frontend can mount the Swift Agent widget',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Widget config',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    companyId: {
                      type: 'string',
                      example: 'accfc5a7-907a-4009-88e3-b655956aecb3',
                    },
                    apiKey: {
                      type: 'string',
                      example: 'swa_live_xxx',
                    },
                    widgetSrc: {
                      type: 'string',
                      example:
                        'https://widget.swiftagents.org/dist/widget-ui.js',
                    },
                    mode: {
                      type: 'string',
                      example: 'widget',
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          503: { description: 'Swift Agent not configured on server' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
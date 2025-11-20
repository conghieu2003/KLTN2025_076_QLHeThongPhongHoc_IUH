const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Classroom Management System API',
      version: '1.0.0',
      description: 'API documentation for Classroom Management System - IUH',
      contact: {
        name: 'IUH IT Department',
        email: 'conghieusq@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.iuh.edu.vn',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errorCode: {
              type: 'string',
              description: 'Error code'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints - /api/auth'
      },
      {
        name: 'Schedule Management',
        description: 'Schedule management and room assignment endpoints - /api/schedule-management'
      }
    ]
  },
  apis: [
    './src/routes/*.js' // Chỉ scan các route files đang có
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;


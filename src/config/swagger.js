import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cargil Ticketing System API",
      version: "1.0.0",
      description:
        "REST API for the Cargil Ticketing System — tickets, RBAC, auth, and attachments.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Azure AD / SSO JWT token",
        },
      },
      schemas: {
        // ----------------------------------------------------------------
        // Shared filter fields
        // ----------------------------------------------------------------
        TicketFilters: {
          type: "object",
          properties: {
            userId:          { type: "integer", example: 42 },
            roleCode:        { type: "string",  example: "USER" },
            ticketType:      { type: "string",  enum: ["ALL", "SERVICE_REQUEST", "INCIDENT", "TASK"], default: "ALL" },
            queue:           { type: "array",   items: { type: "string" } },
            priority:        { type: "array",   items: { type: "string" } },
            status:          { type: "array",   items: { type: "string" } },
            employee:        { type: "array",   items: { type: "string" } },
            requestor:       { type: "array",   items: { type: "string" } },
            categoryLevel1:  { type: "array",   items: { type: "string" } },
            categoryLevel2:  { type: "array",   items: { type: "string" } },
            categoryLevel3:  { type: "array",   items: { type: "string" } },
            shortDescription:{ type: "string",  maxLength: 200 },
            description:     { type: "string",  maxLength: 200 },
            resolution:      { type: "string",  maxLength: 200 },
            globalSearch:    { type: "string",  maxLength: 500 },
            openDateFrom:    { type: "string",  format: "date" },
            openDateTo:      { type: "string",  format: "date" },
            dueDateFrom:     { type: "string",  format: "date" },
            dueDateTo:       { type: "string",  format: "date" },
            resolveDateFrom: { type: "string",  format: "date" },
            resolveDateTo:   { type: "string",  format: "date" },
            closedDateFrom:  { type: "string",  format: "date" },
            closedDateTo:    { type: "string",  format: "date" },
          },
        },
        // ----------------------------------------------------------------
        // Standard success / error wrappers
        // ----------------------------------------------------------------
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string",  example: "OK" },
            data:    { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string",  example: "Validation error" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan every route file for @swagger JSDoc blocks
  apis: ["./src/modules/**/*.routes.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

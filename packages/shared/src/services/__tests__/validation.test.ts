/**
 * Tests for ValidationService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationService } from '../validation.js';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  describe('validate', () => {
    it('should validate a valid OpenAPI 3.1 YAML spec', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(true);
      expect(result.version).toBe('3.1.0');
      expect(result.errors).toHaveLength(0);
      expect(result.spec).toBeDefined();
      expect(result.spec?.openapi).toBe('3.1.0');
    });

    it('should validate a valid OpenAPI 3.1 JSON spec', async () => {
      const jsonSpec = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      };

      const result = await service.validate(jsonSpec);

      expect(result.valid).toBe(true);
      expect(result.version).toBe('3.1.0');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject OpenAPI 3.0 spec with error', async () => {
      const yamlSpec = `
openapi: 3.0.3
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(false);
      expect(result.version).toBe('3.0.3');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unsupported OpenAPI version');
    });

    it('should reject Swagger 2.0 spec with error', async () => {
      const yamlSpec = `
swagger: "2.0"
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unsupported OpenAPI version');
    });

    it('should return validation errors for invalid spec', async () => {
      const invalidSpec = `
openapi: 3.1.0
info:
  title: Test API
# Missing required 'version' field
paths: {}
`;

      const result = await service.validate(invalidSpec);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
      expect(result.spec).toBeUndefined();
    });

    it('should return validation errors for malformed YAML', async () => {
      const malformedSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
    invalid yaml here: [{
`;

      const result = await service.validate(malformedSpec);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate spec with components and schemas', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate spec with request body', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
      responses:
        "201":
          description: Created
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate spec with security schemes', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Success
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
`;

      const result = await service.validate(yamlSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('dereference', () => {
    it('should dereference $ref pointers', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
`;

      const result = await service.dereference(yamlSpec);

      // After dereferencing, the $ref should be replaced with the actual schema
      const paths = (result as any).paths;
      const responseSchema = paths['/users'].get.responses['200'].content['application/json'].schema;
      
      expect(responseSchema).toBeDefined();
      expect(responseSchema.type).toBe('object');
      expect(responseSchema.properties).toBeDefined();
      expect(responseSchema.properties.id.type).toBe('integer');
    });
  });

  describe('bundle', () => {
    it('should bundle external references', async () => {
      const yamlSpec = `
openapi: 3.1.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        "200":
          description: Success
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
`;

      const result = await service.bundle(yamlSpec);

      expect(result).toBeDefined();
      expect((result as any).openapi).toBe('3.1.0');
    });
  });
});

/**
 * Template Detection Service
 * Auto-detects appropriate OpenAPI templates based on user description
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../../../.openapi-templates');

export interface TemplateInfo {
  name: string;
  path: string;
  domain: string;
  description: string;
  keywords: string[];
}

export interface DetectionResult {
  template: TemplateInfo;
  confidence: number;
  matchedKeywords: string[];
}

const TEMPLATES: TemplateInfo[] = [
  {
    name: 'rest-crud',
    path: 'domains/rest-crud/template.yaml',
    domain: 'REST CRUD',
    description: 'Standard REST API with CRUD operations',
    keywords: [
      'crud', 'rest', 'restful', 'resource', 'entity',
      'list', 'create', 'read', 'update', 'delete',
      'get', 'post', 'put', 'patch', 'standard'
    ]
  },
  {
    name: 'ecommerce',
    path: 'domains/ecommerce/template.yaml',
    domain: 'E-commerce',
    description: 'E-commerce API with products, carts, and orders',
    keywords: [
      'ecommerce', 'e-commerce', 'shop', 'shopping', 'store',
      'product', 'cart', 'order', 'checkout', 'payment',
      'inventory', 'catalog', 'purchase', 'customer'
    ]
  },
  {
    name: 'saas',
    path: 'domains/saas/template.yaml',
    domain: 'SaaS',
    description: 'SaaS application API with users, tenants, and subscriptions',
    keywords: [
      'saas', 'tenant', 'organization', 'workspace', 'team',
      'subscription', 'billing', 'account', 'member',
      'role', 'permission', 'multi-tenant'
    ]
  }
];

export class TemplateDetectionService {
  /**
   * Detect the most appropriate template based on user description
   */
  detectTemplate(description: string): DetectionResult | null {
    const lowerDescription = description.toLowerCase();
    const results: DetectionResult[] = [];

    for (const template of TEMPLATES) {
      const matchedKeywords: string[] = [];
      let matchCount = 0;

      for (const keyword of template.keywords) {
        if (lowerDescription.includes(keyword)) {
          matchedKeywords.push(keyword);
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = matchCount / template.keywords.length;
        results.push({
          template,
          confidence,
          matchedKeywords
        });
      }
    }

    // Sort by confidence (descending)
    results.sort((a, b) => b.confidence - a.confidence);

    // Return the best match if confidence is reasonable
    if (results.length > 0 && results[0].confidence > 0.1) {
      return results[0];
    }

    // Default to standard template if no clear match
    return {
      template: TEMPLATES[0], // rest-crud as default
      confidence: 0,
      matchedKeywords: []
    };
  }

  /**
   * Load template content
   */
  async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = join(TEMPLATES_DIR, templatePath);
    return await readFile(fullPath, 'utf-8');
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates(): TemplateInfo[] {
    return TEMPLATES;
  }

  /**
   * Get template by name
   */
  getTemplateByName(name: string): TemplateInfo | undefined {
    return TEMPLATES.find(t => t.name === name);
  }
}

export const templateDetectionService = new TemplateDetectionService();

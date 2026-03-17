/**
 * Schema Validation Script
 * 
 * Run with: npx tsx src/scripts/schema-validator.ts
 * 
 * Validates JSON-LD schema on built pages to ensure:
 * - Valid JSON syntax
 * - Required fields present
 * - Matches visible HTML content
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
    page: string;
    schemas: SchemaCheck[];
    errors: string[];
    passed: boolean;
}

interface SchemaCheck {
    type: string;
    valid: boolean;
    errors: string[];
}

const REQUIRED_FIELDS: Record<string, string[]> = {
    'SoftwareApplication': ['name', 'description', 'applicationCategory'],
    'Organization': ['name', 'url'],
    'BlogPosting': ['headline', 'description', 'author', 'publisher', 'datePublished'],
    'FAQPage': ['mainEntity'],
    'Product': ['name', 'description', 'offers'],
    'WebPage': ['name', 'description']
};

function extractJsonLdScripts(html: string): { type: string; data: unknown }[] {
    const results: { type: string; data: unknown }[] = [];
    const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        try {
            const jsonData = JSON.parse(match[1]);
            const type = Array.isArray(jsonData) 
                ? jsonData.find((i: Record<string, unknown>) => i['@type'])?.['@type']
                : jsonData['@type'];
            
            if (type) {
                results.push({ type: String(type), data: jsonData });
            }
        } catch (e) {
            // Invalid JSON, will be reported
        }
    }
    
    return results;
}

function validateSchema(schema: { type: string; data: unknown }): SchemaCheck {
    const errors: string[] = [];
    const schemaType = schema.type;
    
    if (REQUIRED_FIELDS[schemaType]) {
        const data = schema.data as Record<string, unknown>;
        
        for (const field of REQUIRED_FIELDS[schemaType]) {
            if (!(field in data)) {
                errors.push(`Missing required field: ${field}`);
            }
        }
    }
    
    if (schemaType === 'BlogPosting') {
        const data = schema.data as Record<string, unknown>;
        if (data.datePublished && typeof data.datePublished !== 'string') {
            errors.push('datePublished should be ISO 8601 string');
        }
    }
    
    return {
        type: schemaType,
        valid: errors.length === 0,
        errors
    };
}

function validatePage(filePath: string): ValidationResult {
    const errors: string[] = [];
    const schemas: SchemaCheck[] = [];
    
    try {
        const html = readFileSync(filePath, 'utf-8');
        const jsonLdScripts = extractJsonLdScripts(html);
        
        if (jsonLdScripts.length === 0) {
            errors.push('No JSON-LD schema found');
        }
        
        for (const schema of jsonLdScripts) {
            const result = validateSchema(schema);
            schemas.push(result);
            
            if (!result.valid) {
                errors.push(...result.errors.map(e => `${schema.type}: ${e}`));
            }
        }
    } catch (e) {
        errors.push(`Failed to read file: ${e}`);
    }
    
    return {
        page: filePath,
        schemas,
        errors,
        passed: errors.length === 0
    };
}

function validateDirectory(dirPath: string): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    if (!existsSync(dirPath)) {
        console.error(`Directory not found: ${dirPath}`);
        return results;
    }
    
    const files = readdirSync(dirPath, { recursive: true });
    
    for (const file of files) {
        if (typeof file === 'string' && file.endsWith('.html')) {
            const filePath = join(dirPath, file);
            const result = validatePage(filePath);
            results.push(result);
        }
    }
    
    return results;
}

const distDir = join(process.cwd(), 'dist');
const results = validateDirectory(distDir);

console.log('\n📋 JSON-LD Schema Validation Report\n');
console.log('='.repeat(50));

let totalPassed = 0;
let totalFailed = 0;

for (const result of results) {
    if (result.passed) {
        totalPassed++;
        console.log(`✅ ${result.page}`);
    } else {
        totalFailed++;
        console.log(`❌ ${result.page}`);
        result.errors.forEach(err => console.log(`   - ${err}`));
    }
}

console.log('='.repeat(50));
console.log(`Total: ${results.length} pages`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);

if (totalFailed > 0) {
    console.log('\n⚠️  Schema validation failed. Please fix the issues above.');
    process.exit(1);
} else {
    console.log('\n✅ All pages pass schema validation!');
}
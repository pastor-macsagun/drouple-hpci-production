// Export all validation schemas and types
export * from './schemas';
// Validation utilities
import { z } from 'zod';
export function validateData(schema, data) {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            return {
                success: false,
                error: `${firstError.path.join('.')}: ${firstError.message}`
            };
        }
        return { success: false, error: 'Validation failed' };
    }
}
export function createValidationMiddleware(schema) {
    return (data) => {
        const result = validateData(schema, data);
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.data;
    };
}

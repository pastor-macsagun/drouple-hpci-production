export * from './schemas';
import { z } from 'zod';
export declare function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};
export declare function createValidationMiddleware<T>(schema: z.ZodSchema<T>): (data: unknown) => T;

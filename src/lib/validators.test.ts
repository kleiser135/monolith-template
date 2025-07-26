import { describe, it, expect } from 'vitest';
import { changePasswordSchema, resetPasswordSchema } from './validators';

describe('Validators', () => {
    describe('changePasswordSchema', () => {
        it('should fail if passwords do not match', () => {
            const data = {
                currentPassword: 'oldPassword123',
                newPassword: 'newPassword123',
                confirmPassword: 'wrongPassword456'
            };
            const result = changePasswordSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe('Passwords do not match.');
            }
        });

        it('should pass if all fields are valid and passwords match', () => {
            const data = {
                currentPassword: 'oldPassword123',
                newPassword: 'newPassword123',
                confirmPassword: 'newPassword123'
            };
            const result = changePasswordSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if new password is too short', () => {
            const data = {
                currentPassword: 'oldPassword123',
                newPassword: 'short',
                confirmPassword: 'short'
            };
            const result = changePasswordSchema.safeParse(data);
            expect(result.success).toBe(false);
            if(!result.success){
                expect(result.error.flatten().fieldErrors.newPassword?.[0]).toBe('New password must be at least 8 characters.');
            }
        });
    });

    describe('resetPasswordSchema', () => {
        it('should fail if passwords do not match', () => {
            const data = { password: 'newPassword123', confirmPassword: 'wrongPassword456' };
            const result = resetPasswordSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toBe('Passwords do not match');
            }
        });

        it('should pass if passwords match and are long enough', () => {
            const data = { password: 'newPassword123', confirmPassword: 'newPassword123' };
            const result = resetPasswordSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should fail if password is too short', () => {
            const data = { password: 'short', confirmPassword: 'short' };
            const result = resetPasswordSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.flatten().fieldErrors.password?.[0]).toBe('Password must be at least 8 characters long.');
            }
        });
    });
}); 
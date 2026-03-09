/**
 * In-memory security configuration.
 * Persists for the lifetime of the server process.
 * Admin can update via PATCH /api/users/security-config
 */

export interface SecurityConfig {
  maxLoginAttempts: number; // number of failed attempts before permanent lockout (requires admin to unlock)
}

const config: SecurityConfig = {
  maxLoginAttempts: 5,
};

export const getSecurityConfig = (): SecurityConfig => ({ ...config });

export const updateSecurityConfig = (updates: Partial<SecurityConfig>): SecurityConfig => {
  if (updates.maxLoginAttempts !== undefined) {
    if (updates.maxLoginAttempts < 1 || updates.maxLoginAttempts > 20) {
      throw new Error('maxLoginAttempts must be between 1 and 20');
    }
    config.maxLoginAttempts = updates.maxLoginAttempts;
  }
  return { ...config };
};

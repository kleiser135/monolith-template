import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userFactory } from './user.factory';

// Mock faker to ensure consistent testing
vi.mock('@faker-js/faker', () => ({
  faker: {
    person: {
      fullName: vi.fn(() => 'John Doe'),
    },
    internet: {
      email: vi.fn(() => 'test@example.com'),
      password: vi.fn(() => 'password123'),
    },
  },
}));

describe('User Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have a create method', () => {
    expect(userFactory).toHaveProperty('create');
    expect(typeof userFactory.create).toBe('function');
  });

  it('should create a user with default properties', () => {
    const user = userFactory.create();

    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('password');
  });

  it('should use faker to generate user data', () => {
    const user = userFactory.create();

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('password123');
  });

  it('should allow overriding default values', () => {
    const overrides = {
      name: 'Custom Name',
      email: 'custom@example.com',
    };

    const user = userFactory.create(overrides);

    expect(user.name).toBe('Custom Name');
    expect(user.email).toBe('custom@example.com');
    expect(user.password).toBe('password123'); // Should use default
  });

  it('should allow overriding all properties', () => {
    const overrides = {
      name: 'Override Name',
      email: 'override@example.com',
      password: 'overridePassword',
    };

    const user = userFactory.create(overrides);

    expect(user.name).toBe('Override Name');
    expect(user.email).toBe('override@example.com');
    expect(user.password).toBe('overridePassword');
  });

  it('should handle empty overrides object', () => {
    const user = userFactory.create({});

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('password123');
  });

  it('should handle undefined overrides', () => {
    const user = userFactory.create(undefined);

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('password123');
  });

  it('should create multiple users with consistent structure', () => {
    const user1 = userFactory.create();
    const user2 = userFactory.create({ name: 'Different Name' });

    expect(Object.keys(user1)).toEqual(['name', 'email', 'password']);
    expect(Object.keys(user2)).toEqual(['name', 'email', 'password']);
    expect(user2.name).toBe('Different Name');
  });

  it('should handle additional properties in overrides', () => {
    const overrides = {
      name: 'Test User',
      customField: 'custom value',
    };

    const user = userFactory.create(overrides);

    expect(user.name).toBe('Test User');
    expect(user.customField).toBe('custom value');
    expect(user.email).toBe('test@example.com');
    expect(user.password).toBe('password123');
  });
});

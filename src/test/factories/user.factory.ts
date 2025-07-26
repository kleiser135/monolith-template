import { faker } from '@faker-js/faker';

export const userFactory = {
  create: (overrides = {}) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      ...overrides,
    };
  },
}; 
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to create a user by running the db:seed script.
     */
    createUser(): Chainable<void>;

    /**
     * Custom command to reset the database.
     */
    resetDatabase(): Chainable<void>;

    /**
     * Custom command to get the latest password reset token from the database.
     */
    getLatestPasswordResetToken(): Chainable<string>;
  }
} 
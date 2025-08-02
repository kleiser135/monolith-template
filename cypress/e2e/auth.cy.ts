/// <reference types="cypress" />

describe('Authentication Flows', () => {
  it('should allow a user to sign up and be redirected to the login page', () => {
    // Start with a clean database and go directly to signup
    cy.resetDatabase();
    cy.visit('/signup');

    // Generate a unique email for the new user
    const uniqueEmail = `testuser+${Date.now()}@example.com`;

    // Fill out and submit the signup form
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('[data-testid="signup-submit"]').click();

    // Verify redirection to the login page
    cy.url().should('include', '/login');

    // Verify the success toast message is visible
    cy.contains('Account created! Please check your email to verify your account.').should('be.visible');
  });

  it('should allow a user to log in and log out', () => {
    // Seed the database and go directly to login
    cy.resetDatabase();
    cy.createUser();
    cy.visit('/login');

    // Fill out and submit the login form with our pre-seeded user
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Verify redirection to the dashboard and presence of logout button
    cy.url().should('include', '/dashboard');
    cy.contains('Logout').should('be.visible');

    // Perform logout
    cy.contains('Logout').click();

    // Verify redirection to the homepage and presence of login button
    cy.url().should('eq', 'http://localhost:3000/');
    cy.contains('Login').should('be.visible');
  });

  it('should allow a user to reset their password', () => {
    // Seed the database
    cy.resetDatabase();
    cy.createUser();

    // Navigate to the forgot password page
    cy.visit('/forgot-password');

    // Intercept the API call to get the token
    cy.intercept('POST', '/api/auth/forgot-password').as('forgotPassword');

    // Request a password reset
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('button[type="submit"]').click();

    // Wait for the API call and get the token from the response
    cy.wait('@forgotPassword').its('response.body').then((body: any) => {
      const { token } = body;
      cy.visit(`/reset-password?token=${token}`);

      // Fill out the new password
      const newPassword = 'newPassword123';
      cy.get('input[name="password"]').type(newPassword);
      cy.get('input[name="confirmPassword"]').type(newPassword);
      cy.get('button[type="submit"]').click();

      // Verify redirection to login and success message
      cy.url().should('include', '/login');
      cy.contains('Password reset successfully.').should('be.visible');

      // Wait a moment for any animations to complete and form to be ready
      cy.wait(1000);

      // Verify the new password works by logging in
      cy.get('input[name="email"]').should('be.visible').clear().type('test@example.com');
      cy.get('input[name="password"]').should('be.visible').clear().type(newPassword);
      cy.get('button[type="submit"]').click();
      
      // Wait for login to process and redirect
      cy.url().should('include', '/dashboard', { timeout: 10000 });
      cy.contains('Logout').should('be.visible');
    });
  });
}); 
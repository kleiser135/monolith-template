/// <reference types="cypress" />

describe('Dashboard Features', () => {
  beforeEach(() => {
    // Set up clean database and create a user
    cy.resetDatabase();
    cy.createUser();
    
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should load the dashboard page successfully', () => {
    cy.contains('Welcome').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should navigate to profile page and back', () => {
    // Navigate to profile
    cy.contains('Profile').click();
    cy.url().should('include', '/dashboard/profile');
    
    // Check profile page loads
    cy.contains('Profile').should('be.visible');
    
    // Navigate back to dashboard
    cy.contains('Dashboard').click();
    cy.url().should('include', '/dashboard');
    cy.url().should('not.include', '/profile');
  });

  it('should allow user to log out from dashboard', () => {
    // Click logout button
    cy.contains('Logout').click();
    
    // Should redirect to home page
    cy.url().should('eq', 'http://localhost:3000/');
    cy.contains('Login').should('be.visible');
  });

  it('should show user navigation options', () => {
    // Check that user has access to dashboard navigation
    cy.contains('Dashboard').should('be.visible');
    
    // Check that user can access profile via direct navigation
    cy.visit('/dashboard/profile');
    cy.url().should('include', '/profile');
    cy.contains('Profile').should('be.visible');
    
    // Go back to dashboard
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });

  it('should be able to access toast demo', () => {
    // Navigate to toast demo if it exists
    cy.visit('/dashboard/toast-demo');
    cy.url().should('include', '/toast-demo');
  });
});

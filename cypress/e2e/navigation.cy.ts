/// <reference types="cypress" />

describe('Navigation and Landing Page', () => {
  it('should navigate through the landing page sections', () => {
    cy.visit('/');
    
    // Check main elements are visible
    cy.contains('Build Your Next App').should('be.visible');
    cy.contains('Get Started').should('be.visible');
    cy.contains('Sign In').should('be.visible');
  });

  it('should navigate from landing page to auth pages', () => {
    cy.visit('/');
    
    // Navigate to login
    cy.contains('Sign In').click();
    cy.url().should('include', '/login');
    cy.contains('Sign in').should('be.visible');
    
    // Navigate to signup from login
    cy.contains('Sign up').click();
    cy.url().should('include', '/signup');
    cy.contains('Create account').should('be.visible');
    
    // Navigate to forgot password from login
    cy.visit('/login');
    cy.contains('Forgot your password?').click();
    cy.url().should('include', '/forgot-password');
    cy.contains('Send Reset Link').should('be.visible');
  });

  it('should handle protected routes', () => {
    // Try to access dashboard without authentication
    cy.visit('/dashboard');
    // Should redirect to login or show login prompt
    cy.url().should('include', '/login');
  });

  it('should maintain authentication state', () => {
    // Reset and seed database
    cy.resetDatabase();
    cy.createUser();
    
    // Login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    
    // Refresh page - should stay authenticated
    cy.reload();
    cy.url().should('include', '/dashboard');
    
    // Navigate to other pages and back
    cy.visit('/dashboard/profile');
    cy.url().should('include', '/profile');
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
  });
});

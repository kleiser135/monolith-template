describe('App', () => {
  it('should have a heading', () => {
    cy.visit('/');
    cy.get('h1').contains('Welcome');
  });
}); 
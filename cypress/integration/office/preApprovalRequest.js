import {
  fillAndSavePreApprovalRequest,
  editPreApprovalRequest,
  approvePreApprovalRequest,
  deletePreApprovalRequest,
} from '../../support/preapprovals/testCreateRequest';

/* global cy */
describe('office user interacts with pre approval request panel', function() {
  beforeEach(() => {
    cy.signIntoOffice();
  });
  it('office user creates pre approval request', function() {
    officeUserCreatesPreApprovalRequest();
  });
  it('office user edits pre approval request', function() {
    officeUserEditsPreApprovalRequest();
  });
  it('office user approves pre approval request', function() {
    officeUserApprovesPreApprovalRequest();
  });
  it('office user deletes pre approval request', function() {
    officeUserDeletesPreApprovalRequest();
  });
});

function officeUserCreatesPreApprovalRequest() {
  // Open new moves queue
  cy.patientVisit('/queues/all');
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/all/);
  });

  // Find move and open it
  cy.selectQueueItemMoveLocator('RLKBEM');

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/basics/);
  });

  // Click on HHG tab
  cy
    .get('span')
    .contains('HHG')
    .click();
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/hhg/);
  });

  // Verify that the Estimates section contains expected data
  cy.get('span').contains('2,000');

  fillAndSavePreApprovalRequest();
  // Verify data has been saved in the UI
  cy.get('tr[data-cy="130B"]').should(td => {
    const text = td.text();
    expect(text).to.include('Bulky Article: Motorcycle/Rec vehicle');
  });
}
function officeUserEditsPreApprovalRequest() {
  // Open new moves queue
  cy.patientVisit('/queues/all');
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/all/);
  });

  // Find move and open it
  cy.selectQueueItemMoveLocator('RLKBEM');

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/basics/);
  });

  // Click on HHG tab
  cy
    .get('span')
    .contains('HHG')
    .click();
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/hhg/);
  });

  // Verify that the Estimates section contains expected data
  cy.get('span').contains('2,000');

  editPreApprovalRequest();
  // Verify data has been saved in the UI
  cy.get('tr[data-cy="130B"]').should(td => {
    const text = td.text();
    expect(text).to.include('edited');
  });
}

function officeUserApprovesPreApprovalRequest() {
  // Open new moves queue
  cy.patientVisit('/queues/all');
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/all/);
  });

  // Find move and open it
  cy.selectQueueItemMoveLocator('RLKBEM');

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/basics/);
  });

  // Click on HHG tab
  cy
    .get('span')
    .contains('HHG')
    .click();
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/hhg/);
  });

  // Verify that the Estimates section contains expected data
  cy.get('span').contains('2,000');

  approvePreApprovalRequest();
  cy.get('.pre-approval-panel td').contains('Approved');
}

function officeUserDeletesPreApprovalRequest() {
  // Open new moves queue
  cy.patientVisit('/queues/all');
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/all/);
  });

  // Find move and open it
  cy.selectQueueItemMoveLocator('RLKBEM');

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/basics/);
  });

  // Click on HHG tab
  cy
    .get('span')
    .contains('HHG')
    .click();
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/queues\/new\/moves\/[^/]+\/hhg/);
  });

  // Verify that the Estimates section contains expected data
  cy.get('span').contains('2,000');

  deletePreApprovalRequest();
  cy
    .get('.pre-approval-panel td')
    .first()
    .should('not.contain', 'Bulky Article: Motorcycle/Rec vehicle');
}

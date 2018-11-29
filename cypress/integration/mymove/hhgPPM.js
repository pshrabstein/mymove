/* global cy */

describe('service member adds a ppm to an hhg', function() {
  it('service member clicks on Add PPM Shipment', function() {
    serviceMemberSignsIn('f83bc69f-10aa-48b7-b9fe-425b393d49b8');
    serviceMemberAddsPPMToHHG();
    serviceMemberCancelsAddPPMToHHG();
    serviceMemberContinuesPPMSetup();
    serviceMemberFillsInDatesAndLocations({
      plannedMoveDate: '5/20/2018',
      pickupPostalCode: '90210',
      destinationPostalCode: '50309',
    });
    serviceMemberSelectsWeightRange();
    serviceMemberCanCustomizeWeight();
    serviceMemberCanReviewMoveSummary();
    serviceMemberCanSignAgreement();
    serviceMemberViewsUpdatedHomePage();
    serviceMemberSignsOut();
  });
});

describe('service member adds a ppm to a slightly different hhg', function() {
  it('service member clicks on Add PPM Shipment', function() {
    serviceMemberSignsIn('d33ab882-8e26-4ef3-b195-2b53c9809291');
    serviceMemberAddsPPMToHHG();
    serviceMemberCancelsAddPPMToHHG();
    serviceMemberContinuesPPMSetup();
    serviceMemberFillsInDatesAndLocations({
      plannedMoveDate: '3/15/2018',
      pickupPostalCode: '90210',
      destinationPostalCode: '50309',
    });
    serviceMemberSelectsWeightRange();
    serviceMemberCanCustomizeWeight();
    serviceMemberCanReviewMoveSummary();
    serviceMemberCanSignAgreement();
    serviceMemberViewsUpdatedHomePage();
    serviceMemberSignsOut();
  });
});

function serviceMemberSignsIn(uuid) {
  cy.signInAsUser(uuid);
}

function serviceMemberSignsOut() {
  cy.logout();
}

function serviceMemberAddsPPMToHHG() {
  cy
    .get('.sidebar > div > button')
    .contains('Add PPM Shipment')
    .click();

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-start/);
  });

  // does not have a back button on first flow page
  cy
    .get('button')
    .contains('Back')
    .should('not.be.visible');
}

function serviceMemberCancelsAddPPMToHHG() {
  cy
    .get('.usa-button-secondary')
    .contains('Cancel')
    .click();

  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\//);
  });
}

function serviceMemberContinuesPPMSetup() {
  cy
    .get('button')
    .contains('Continue Move Setup')
    .click();
}

function serviceMemberFillsInDatesAndLocations({ plannedMoveDate, pickupPostalCode, destinationPostalCode }) {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-start/);
  });

  cy
    .get('input[name="planned_move_date"]')
    .should('have.value', plannedMoveDate)
    .clear()
    .first()
    .type('9/2/2018{enter}')
    .blur();

  cy.get('input[name="pickup_postal_code"]').should('have.value', pickupPostalCode);

  cy.get('input[name="destination_postal_code"]').should('have.value', destinationPostalCode);

  cy.nextPage();
}

function serviceMemberSelectsWeightRange() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-size/);
  });

  cy.get('.entitlement-container p:nth-child(2)').should($div => {
    const text = $div.text();
    expect(text).to.include('Estimated 2,000 lbs entitlement remaining (10,500 lbs - 8,500 lbs estimated HHG weight).');
  });
  //todo verify entitlement
  cy.contains('A trailer').click();

  cy.nextPage();
}

function serviceMemberCanCustomizeWeight() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-weight/);
  });

  cy.get('.rangeslider__handle').click();

  cy.get('.incentive').contains('$');

  cy.nextPage();
}

function serviceMemberCanReviewMoveSummary() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/review/);
  });

  cy.get('body').should($div => expect($div.text()).not.to.include('Government moves all of your stuff (HHG)'));
  cy.get('.ppm-container').should($div => {
    const text = $div.text();
    expect(text).to.include('Shipment - You move your stuff (PPM)');
    expect(text).to.include('Move Date: 05/20/2018');
    expect(text).to.include('Pickup ZIP Code:  90210');
    expect(text).to.include('Delivery ZIP Code:  50309');
    expect(text).not.to.include('Storage: Not requested');
    expect(text).to.include('Estimated Weight:  1,50');
    expect(text).to.include('Estimated PPM Incentive:  $4,255.80 - 4,703.78');
  });

  cy.nextPage();
}
function serviceMemberCanSignAgreement() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-agreement/);
  });

  cy
    .get('body')
    .should($div =>
      expect($div.text()).to.include(
        'Before officially booking your move, please carefully read and then sign the following.',
      ),
    );

  cy.get('input[name="signature"]').type('Jane Doe');
  cy.nextPage();
}

function serviceMemberViewsUpdatedHomePage() {
  cy.location().should(loc => {
    expect(loc.pathname).to.eq('/');
  });

  cy.get('body').should($div => {
    expect($div.text()).to.include('Government Movers and Packers (HHG)');
    // TODO We should uncomment next line and delete this
    // and the line following the commented line once ppms can be submitted
    // expect($div.text()).to.include('Move your own stuff (PPM)');
    expect($div.text()).to.include('Move to be scheduled');
    expect($div.text()).to.not.include('Add PPM Shipment');
  });

  cy.get('.usa-width-three-fourths').should($div => {
    const text = $div.text();
    // HHG information and details
    expect(text).to.include('Next Step: Prepare for move');
    expect(text).to.include('Weight (est.): 2000 lbs');
    // TODO Once PPM can be submitted, the following 4 lines should be uncommented and this removed.
    // // PPM information and details
    // expect(text).to.include('Next Step: Wait for approval');
    // expect(text).to.include('Weight (est.): 150');
    // expect(text).to.include('Incentive (est.): $2,032.89 - 2,246.87');
  });
}

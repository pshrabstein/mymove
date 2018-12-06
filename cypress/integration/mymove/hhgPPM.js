/* global cy */

describe('service member adds a ppm to an hhg', function() {
  it('service member clicks on Add PPM (DITY) Move', function() {
    serviceMemberSignsIn('f83bc69f-10aa-48b7-b9fe-425b393d49b8');
    serviceMemberAddsPPMToHHG();
    serviceMemberCancelsAddPPMToHHG();
    serviceMemberContinuesPPMSetup();
    serviceMemberFillsInDatesAndLocations();
    serviceMemberSelectsWeightRange();
    serviceMemberCanCustomizeWeight();
    serviceMemberCanReviewMoveSummary();
    serviceMemberCanSignAgreement();
    serviceMemberViewsUpdatedHomePage();
  });
});

function serviceMemberSignsIn(uuid) {
  cy.signInAsUser(uuid);
}

function serviceMemberAddsPPMToHHG() {
  cy
    .get('.sidebar > div > button')
    .contains('Add PPM (DITY) Move')
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

function serviceMemberFillsInDatesAndLocations() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-start/);
  });

  cy.get('.wizard-header').should('contain', 'Move Setup');

  cy
    .get('input[name="planned_move_date"]')
    .should('have.value', '5/20/2018')
    .clear()
    .first()
    .type('9/2/2018{enter}')
    .blur();

  cy.get('input[name="pickup_postal_code"]').should('have.value', '90210');

  cy.get('input[name="destination_postal_code"]').should('have.value', '50309');

  cy.nextPage();
}

function serviceMemberSelectsWeightRange() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/hhg-ppm-size/);
  });

  cy.get('.wizard-header').should('contain', 'Move Setup');

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

  cy.get('.wizard-header').should('contain', 'Move Setup');

  cy.get('.rangeslider__handle').click();

  cy.get('.incentive').contains('$');

  cy.nextPage();
}

function serviceMemberCanReviewMoveSummary() {
  cy.location().should(loc => {
    expect(loc.pathname).to.match(/^\/moves\/[^/]+\/review/);
  });

  cy.get('.wizard-header').should('not.contain', 'Move Setup');
  cy.get('.wizard-header').should('not.contain', 'Review');

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

  cy.get('.wizard-header').should('contain', 'Review');

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
    expect($div.text()).to.include('Government Movers and Packers');
    expect($div.text()).to.include('Move your own stuff');
    expect($div.text()).to.not.include('Add PPM (DITY) Move');
  });

  cy.get('.usa-width-three-fourths').should($div => {
    const text = $div.text();
    // PPM information and details
    expect(text).to.include('Next Step: Wait for approval');
    expect(text).to.include('Weight (est.): 150');
    expect(text).to.include('Incentive (est.): $4,255.80 - 4,703.78');
  });
}

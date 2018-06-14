import React, { Fragment } from 'react';

import { get } from 'lodash';
import moment from 'moment';

import TransportationOfficeContactInfo from 'shared/TransportationOffices/TransportationOfficeContactInfo';
import './MoveSummary.css';
import ppmCar from './images/ppm-car.svg';
import truck from 'shared/icon/truck-gray.svg';
import ppmDraft from './images/ppm-draft.png';
import ppmSubmitted from './images/ppm-submitted.png';
import ppmApproved from './images/ppm-approved.png';
import ppmInProgress from './images/ppm-in-progress.png';
import { ppmInfoPacket } from 'shared/constants';
import { formatCents } from 'shared/formatters';

const CanceledMoveSummary = props => {
  return (
    <Fragment>
      <h2>New move</h2>
      <div className="shipment_box">
        <div className="shipment_type">
          <img className="move_sm" src={truck} alt="ppm-car" />
          Start here
        </div>
      </div>
    </Fragment>
  );
};

const DraftMoveSummary = props => {
  const { orders, profile, move, entitlement, resumeMove } = props;
  return (
    <Fragment>
      <MoveInfoHeader
        orders={orders}
        profile={profile}
        move={move}
        entitlement={entitlement}
      />
      <div className="shipment_box">
        <div className="shipment_type">
          <img className="move_sm" src={truck} alt="ppm-car" />
          Move to be scheduled
        </div>

        <div className="shipment_box_contents">
          <div>
            <img className="status_icon" src={ppmDraft} alt="status" />
            <div className="step-contents">
              <div className="status_box usa-width-two-thirds">
                <div className="step">
                  <div className="title">
                    Next Step: Finish setting up your move
                  </div>
                  <div>
                    Questions or need help? Contact your local Transportation
                    Office (PPPO) at {get(profile, 'current_station.name')}.
                  </div>
                </div>
              </div>
              <div className="usa-width-one-third">
                <div className="titled_block">
                  <div className="title">Details</div>
                  <div>No detail</div>
                </div>
                <div className="titled_block">
                  <div className="title">Documents</div>
                  <div className="details-links">No documents</div>
                </div>
              </div>
            </div>
            <div className="step-links">
              <button onClick={resumeMove}>Continue Move Setup</button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const SubmittedMoveSummary = props => {
  const { ppm, orders, profile, move, entitlement } = props;
  return (
    <Fragment>
      <MoveInfoHeader
        orders={orders}
        profile={profile}
        move={move}
        entitlement={entitlement}
      />
      <div className="shipment_box">
        <div className="shipment_type">
          <img className="move_sm" src={ppmCar} alt="ppm-car" />
          Move your own stuff (PPM)
        </div>

        <div className="shipment_box_contents">
          <img className="status_icon" src={ppmSubmitted} alt="status" />
          <div className="step-contents">
            <div className="status_box usa-width-two-thirds">
              <div className="step">
                <div className="title">Next Step: Awaiting approval</div>
                <div>
                  Your shipment is awaiting approval. This can take up to 3
                  business days. Questions or need help? Contact your local
                  Transportation Office (PPPO) at {profile.current_station.name}.
                </div>
              </div>
            </div>
            <div className="usa-width-one-third">
              <MoveDetails ppm={ppm} />
              <div className="titled_block">
                <div className="title">Documents</div>
                <div className="details-links">
                  <a
                    href={ppmInfoPacket}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PPM Info Packet
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="step-links">
            <FindWeightScales />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const ApprovedMoveSummary = props => {
  const { ppm, orders, profile, move, entitlement } = props;
  const moveInProgress = moment(
    ppm.planned_move_date,
    'YYYY-MM-DD',
  ).isSameOrBefore();
  return (
    <Fragment>
      <MoveInfoHeader
        orders={orders}
        profile={profile}
        move={move}
        entitlement={entitlement}
      />
      <div className="shipment_box">
        <div className="shipment_type">
          <img className="move_sm" src={ppmCar} alt="ppm-car" />
          Move your own stuff (PPM)
        </div>

        <div className="shipment_box_contents">
          {moveInProgress ? (
            <img className="status_icon" src={ppmInProgress} alt="status" />
          ) : (
            <img className="status_icon" src={ppmApproved} alt="status" />
          )}

          <div className="step-contents">
            <div className="status_box usa-width-two-thirds">
              {!moveInProgress && (
                <div className="step">
                  <div className="title">Next step: Get ready to move</div>
                  <div>
                    Remember to save your weight tickets and expense receipts.
                    For more information, read the PPM info packet.
                  </div>
                  <a
                    href={ppmInfoPacket}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className="usa-button-secondary">
                      Read PPM Info Packet
                    </button>
                  </a>
                </div>
              )}
              <div className="step">
                <div className="title">Next step: Request Payment</div>
                <div>
                  Request a PPM payment, a storage payment, or an advance
                  against your PPM payment before your move is done.
                </div>
                <button className="usa-button-secondary" disabled={true}>
                  Request Payment - Coming Soon!
                </button>
              </div>
            </div>
            <div className="usa-width-one-third">
              <MoveDetails ppm={ppm} />
              <div className="titled_block">
                <div className="title">Documents</div>
                <div className="details-links">
                  <a
                    href={ppmInfoPacket}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    PPM Info Packet
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="step-links">
            <FindWeightScales />
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const MoveDetails = props => {
  const { ppm } = props;
  const privateStorageString = get(ppm, 'estimated_storage_reimbursement')
    ? `(up to ${ppm.estimated_storage_reimbursement})`
    : '';
  const advanceString = ppm.has_requested_advance
    ? `Advance Requested: $${formatCents(ppm.advance.requested_amount)}`
    : '';
  const hasSitString = `Temp. Storage: ${
    ppm.days_in_storage
  } days ${privateStorageString}`;

  return (
    <div className="titled_block">
      <div className="title">Details</div>
      <div>Weight (est.): {ppm.weight_estimate} lbs</div>
      <div>Incentive (est.): {ppm.estimated_incentive}</div>
      {ppm.has_sit && <div>{hasSitString}</div>}
      {ppm.has_requested_advance && <div>{advanceString}</div>}
    </div>
  );
};

const FindWeightScales = () => (
  <span>
    <a
      href="https://www.move.mil/resources/locator-maps"
      target="_blank"
      rel="noopener noreferrer"
    >
      Find Weight Scales
    </a>
  </span>
);

const MoveInfoHeader = props => {
  const { orders, profile, move, entitlement } = props;
  return (
    <Fragment>
      <h2>
        {get(orders, 'new_duty_station.name', 'New move')} from{' '}
        {get(profile, 'current_station.name', '')}
      </h2>
      {move && <div>Move Locator: {get(move, 'locator')}</div>}
      {entitlement && (
        <div>
          Weight Entitlement:{' '}
          <span>{entitlement.sum.toLocaleString()} lbs</span>
        </div>
      )}
    </Fragment>
  );
};

export const MoveSummary = props => {
  const {
    profile,
    move,
    orders,
    ppm,
    editMove,
    entitlement,
    resumeMove,
  } = props;
  const status = get(move, 'status', 'DRAFT');
  return (
    <div className="whole_box">
      <div className="usa-width-three-fourths">
        {
          {
            DRAFT: (
              <DraftMoveSummary
                orders={orders}
                profile={profile}
                move={move}
                entitlement={entitlement}
                resumeMove={resumeMove}
              />
            ),
            SUBMITTED: (
              <SubmittedMoveSummary
                ppm={ppm}
                orders={orders}
                profile={profile}
                move={move}
                entitlement={entitlement}
              />
            ),
            APPROVED: (
              <ApprovedMoveSummary
                ppm={ppm}
                orders={orders}
                profile={profile}
                move={move}
                entitlement={entitlement}
              />
            ),
            CANCELED: (
              <CanceledMoveSummary
                ppm={ppm}
                orders={orders}
                profile={profile}
                move={move}
                entitlement={entitlement}
              />
            ),
          }[status]
        }
      </div>

      <div className="sidebar usa-width-one-fourth">
        <div>
          <button
            className="usa-button-secondary"
            onClick={() => editMove(move)}
            disabled={status === 'DRAFT'}
          >
            Edit Move
          </button>
        </div>

        <div className="contact_block">
          <div className="title">Contacts</div>
          <TransportationOfficeContactInfo
            dutyStation={profile.current_station}
            isOrigin={true}
          />
          <TransportationOfficeContactInfo
            dutyStation={get(orders, 'new_duty_station')}
          />
        </div>
      </div>
    </div>
  );
};

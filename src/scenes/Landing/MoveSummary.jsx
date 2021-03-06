import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { get, includes, isEmpty } from 'lodash';
import moment from 'moment';
import fedHolidays from '@18f/us-federal-holidays';

import { ppmInfoPacket, hhgInfoPacket } from 'shared/constants';
import Alert from 'shared/Alert';
import { formatCents, formatCentsRange } from 'shared/formatters';
import TransportationOfficeContactInfo from 'shared/TransportationOffices/TransportationOfficeContactInfo';
import TransportationServiceProviderContactInfo from 'scenes/TransportationServiceProvider/ContactInfo';
import truck from 'shared/icon/truck-gray.svg';
import { selectReimbursement } from 'shared/Entities/modules/ppms';

import './MoveSummary.css';
import ppmCar from './images/ppm-car.svg';
import { PPMStatusTimeline, ShipmentStatusTimeline, ProfileStatusTimeline } from './StatusTimeline';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';

export const CanceledMoveSummary = props => {
  const { profile, reviewProfile } = props;
  const currentStation = get(profile, 'current_station');
  const stationPhone = get(currentStation, 'transportation_office.phone_lines.0');
  return (
    <Fragment>
      <h2>New move</h2>
      <br />
      <div>
        <div className="shipment_box">
          <div className="shipment_type">
            <img className="move_sm" src={truck} alt="ppm-car" />
            Start here
          </div>

          <div className="shipment_box_contents">
            <div className="step-contents">
              <div className="status_box usa-width-two-thirds">
                <div className="step">
                  <div>
                    Make sure you have a copy of your move orders before you get started. Questions or need to help?
                    Contact your local Transportation Office (PPPO) at {get(currentStation, 'name')}
                    {stationPhone ? ` at ${stationPhone}` : ''}.
                  </div>
                </div>
              </div>
            </div>
            <div className="step-links">
              <button onClick={reviewProfile}>Start</button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export const DraftMoveSummary = props => {
  const { profile, resumeMove } = props;
  return (
    <Fragment>
      <div>
        <div className="shipment_box">
          <div className="shipment_type">
            <img className="move_sm" src={truck} alt="ppm-car" />
            Move to be scheduled
          </div>

          <div className="shipment_box_contents">
            <div>
              <ProfileStatusTimeline profile={profile} />
              <div className="step-contents">
                <div className="status_box usa-width-two-thirds">
                  <div className="step">
                    <div className="title">Next Step: Finish setting up your move</div>
                    <div>
                      Questions or need help? Contact your local Transportation Office (PPPO) at{' '}
                      {get(profile, 'current_station.name')}.
                    </div>
                  </div>
                </div>
                <div className="usa-width-one-third">
                  <div className="titled_block">
                    <div className="title">Details</div>
                    <div>No details</div>
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
      </div>
    </Fragment>
  );
};

export const SubmittedPpmMoveSummary = props => {
  const { ppm } = props;
  return (
    <Fragment>
      <div>
        <Alert type="success" heading="Congrats - your move is submitted!">
          Next, wait for approval. Once approved:<br />
          <ul>
            <li>
              Get certified <strong>weight tickets</strong>, both empty &amp; full
            </li>
            <li>
              Save <strong>expense receipts</strong>, including for storgage
            </li>
            <li>
              Read the{' '}
              <strong>
                <a>PPM info sheet</a>
              </strong>{' '}
              for more info
            </li>
          </ul>
        </Alert>

        <div className="shipment_box">
          <div className="shipment_type">
            <img className="move_sm" src={ppmCar} alt="ppm-car" />
            Move your own stuff (PPM)
          </div>

          <div className="shipment_box_contents">
            <PPMStatusTimeline ppm={ppm} />
            <div className="step-contents">
              <div className="status_box usa-width-two-thirds">
                <div className="step">
                  <div className="title">Next Step: Wait for approval &amp; get ready</div>
                  <div className="next-step">
                    You'll be notified when your move is approved (up to 3 days). To get ready to move:
                    <ul>
                      <li>
                        Go to <a>weight scales</a> to get empty &amp; full weight tickets.
                      </li>
                      <li>Save expense receipts, including for storage.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="usa-width-one-third">
                <PPMMoveDetails ppm={ppm} />
                <div className="titled_block">
                  <div className="title">Documents</div>
                  <div className="details-links">
                    <a href={ppmInfoPacket} target="_blank" rel="noopener noreferrer">
                      PPM Info Packet
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <button className="usa-button-secondary" onClick={() => console.log('hi')}>
              Read PPM Info Sheet
            </button>
            <div className="step-links">
              <FindWeightScales />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const getTenDaysBookedDate = bookDate => {
  let businessDays = 0;
  let newDate;
  const bookDateMoment = moment(bookDate);
  while (businessDays < 10) {
    newDate = bookDateMoment.add(1, 'day');
    // Saturday => 6, Sunday => 7
    if (newDate.isoWeekday() !== 6 && newDate.isoWeekday() !== 7 && !fedHolidays.isAHoliday(newDate.toDate())) {
      businessDays += 1;
    }
  }

  return newDate;
};

const showHhgLandingPageText = shipment => {
  const today = moment();
  if (shipment.status === 'DELIVERED' || shipment.status === 'COMPLETED') {
    return (
      <div className="step">
        <div className="title">Next Step: Survey</div>
        <div>
          You will be asked to participate in a satisfaction survey. We will use this information to decide which movers
          we allow to work with you.
        </div>
      </div>
    );
  } else if (today.isBefore(getTenDaysBookedDate(shipment.book_date), 'day')) {
    return (
      <div className="step">
        <div className="title">Next Step: Prepare for move</div>
        <div>
          Your mover will contact you within ten days to schedule a pre-move survey, where they will provide you with a
          detailed weight estimate and more accurate packing and delivery dates.
        </div>
      </div>
    );
  } else {
    return (
      <div className="step">
        <div className="title">Next step: Read pre-move tips</div>
        <div>
          Read the{' '}
          <a href={hhgInfoPacket} target="_blank" rel="noopener noreferrer">
            pre-move tips
          </a>{' '}
          documents, so you know what to expect and are prepared for your move.
        </div>
      </div>
    );
  }
};

export const SubmittedHhgMoveSummary = props => {
  const { shipment, move, addPPMShipment } = props;
  const selectedMoveType = get(move, 'selected_move_type');
  const moveId = get(move, 'id');
  const showAddShipmentLink =
    selectedMoveType === 'HHG' &&
    ['SUBMITTED', 'ACCEPTED', 'AWARDED', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(move.status);

  return (
    <Fragment>
      <div>
        <div className="shipment_box">
          <div className="shipment_type">
            <img className="move_sm" src={truck} alt="hhg-truck" />
            Government Movers and Packers (HHG)
          </div>

          <div className="shipment_box_contents">
            <ShipmentStatusTimeline shipment={shipment} />
            <div className="step-contents">
              <div className="status_box usa-width-two-thirds">
                {showHhgLandingPageText(shipment)}
                {(shipment.status === 'DELIVERED' || shipment.status === 'COMPLETED') && (
                  <TransportationServiceProviderContactInfo showFileAClaimInfo shipmentId={shipment.id} />
                )}
              </div>
              <div className="usa-width-one-third">
                <HhgMoveDetails hhg={shipment} />
                <div className="titled_block">
                  <div className="title">Documents</div>
                  <div className="details-links">
                    <a href={hhgInfoPacket} target="_blank" rel="noopener noreferrer">
                      Pre-move tips
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showAddShipmentLink && (
        <div className="ppm-panel">
          <div className="shipment_box">
            <div className="shipment_type">
              <img className="move_sm" src={ppmCar} alt="ppm-car" />
              Move your own stuff (PPM)
            </div>
            <div className="shipment_box_contents">
              <div className="step-contents">
                <div className="status_box">
                  <div className="step">
                    <div className="title">Are you moving any items yourself or hiring your own mover?</div>
                    <div>Tell us about your move to see if you're eligible for additional payment.</div>
                  </div>
                  <div className="step">
                    <button className="usa-button-secondary" onClick={() => addPPMShipment(moveId)}>
                      <FontAwesomeIcon icon={faPlus} /> Add PPM (DITY) Move
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export const ApprovedMoveSummary = props => {
  const { ppm, move, requestPaymentSuccess, context } = props;
  const paymentRequested = ppm.status === 'PAYMENT_REQUESTED';
  const moveInProgress = moment(ppm.original_move_date, 'YYYY-MM-DD').isSameOrBefore();
  const ppmPaymentRequestRoute = context.flags.ppmPaymentRequest
    ? `moves/${move.id}/ppm-payment-request-intro`
    : `moves/${move.id}/request-payment`;
  return (
    <Fragment>
      <div>
        <div className="shipment_box">
          <div className="shipment_type">
            <img className="move_sm" src={ppmCar} alt="ppm-car" />
            Move your own stuff (PPM)
          </div>

          <div className="shipment_box_contents">
            {requestPaymentSuccess && (
              <Alert type="success" heading="">
                Payment request submitted
              </Alert>
            )}

            <PPMStatusTimeline ppm={ppm} />
            <div className="step-contents">
              <div className="status_box usa-width-two-thirds">
                {!moveInProgress && (
                  <div className="step">
                    <div className="title">Next Step: Get ready to move</div>
                    <div>
                      Remember to save your weight tickets and expense receipts. For more information, read the PPM info
                      packet.
                    </div>
                    <a href={ppmInfoPacket} target="_blank" rel="noopener noreferrer">
                      <button className="usa-button-secondary">Read PPM Info Packet</button>
                    </a>
                  </div>
                )}
                {paymentRequested ? (
                  <div className="step">
                    <div className="title">Your payment is in review</div>
                    <div>
                      You will receive a notification from your destination PPPO office when it has been reviewed.
                    </div>
                  </div>
                ) : (
                  <div className="step">
                    <div className="title">Next Step: Request payment</div>
                    <div>
                      Request a PPM payment, a storage payment, or an advance against your PPM payment before your move
                      is done.
                    </div>
                    <Link to={ppmPaymentRequestRoute} className="usa-button usa-button-secondary">
                      Request Payment
                    </Link>
                  </div>
                )}
              </div>
              <div className="usa-width-one-third">
                <PPMMoveDetails ppm={ppm} />
                <div className="titled_block">
                  <div className="title">Documents</div>
                  <div className="details-links">
                    <a href={ppmInfoPacket} target="_blank" rel="noopener noreferrer">
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
      </div>
    </Fragment>
  );
};

const PPMMoveDetailsPanel = props => {
  const { advance, ppm } = props;
  const privateStorageString = get(ppm, 'estimated_storage_reimbursement')
    ? `(up to ${ppm.estimated_storage_reimbursement})`
    : '';
  const advanceString = ppm.has_requested_advance ? `Advance Requested: $${formatCents(advance.requested_amount)}` : '';
  const hasSitString = `Temp. Storage: ${ppm.days_in_storage} days ${privateStorageString}`;

  return (
    <div className="titled_block">
      <div className="title">Details</div>
      <div>Weight (est.): {ppm.weight_estimate} lbs</div>
      <div>Incentive (est.): {formatCentsRange(ppm.incentive_estimate_min, ppm.incentive_estimate_max)}</div>
      {ppm.has_sit && <div>{hasSitString}</div>}
      {ppm.has_requested_advance && <div>{advanceString}</div>}
    </div>
  );
};

const mapStateToPPMMoveDetailsProps = (state, ownProps) => {
  const { ppm } = ownProps;
  const advance = selectReimbursement(state, ownProps.ppm.advance);
  return { ppm, advance };
};

const PPMMoveDetails = connect(mapStateToPPMMoveDetailsProps)(PPMMoveDetailsPanel);

const HhgMoveDetails = props => {
  return (
    <div className="titled_block">
      <div className="title">Details</div>
      <div>Weight (est.): {props.hhg.weight_estimate} lbs</div>
    </div>
  );
};

const FindWeightScales = () => (
  <span>
    <a href="https://www.move.mil/resources/locator-maps" target="_blank" rel="noopener noreferrer">
      Find Weight Scales
    </a>
  </span>
);

const MoveInfoHeader = props => {
  const { orders, profile, move, entitlement } = props;
  return (
    <Fragment>
      <h2 className="move-summary-header">
        {get(orders, 'new_duty_station.name', 'New move')} (from {get(profile, 'current_station.name', '')})
      </h2>
      {get(move, 'locator') && <div>Move Locator: {get(move, 'locator')}</div>}
      {!isEmpty(entitlement) && (
        <div>
          Weight Entitlement: <span>{entitlement.sum.toLocaleString()} lbs</span>
        </div>
      )}
    </Fragment>
  );
};

const ppmSummaryStatusComponents = {
  DRAFT: DraftMoveSummary,
  SUBMITTED: SubmittedPpmMoveSummary,
  APPROVED: ApprovedMoveSummary,
  CANCELED: CanceledMoveSummary,
  PAYMENT_REQUESTED: ApprovedMoveSummary,
};

const hhgSummaryStatusComponents = {
  DRAFT: DraftMoveSummary,
  SUBMITTED: SubmittedHhgMoveSummary,
  AWARDED: SubmittedHhgMoveSummary,
  ACCEPTED: SubmittedHhgMoveSummary,
  APPROVED: SubmittedHhgMoveSummary,
  IN_TRANSIT: SubmittedHhgMoveSummary,
  DELIVERED: SubmittedHhgMoveSummary,
  COMPLETED: SubmittedHhgMoveSummary,
  CANCELED: CanceledMoveSummary,
};

const getPPMStatus = (moveStatus, ppm, selectedMoveType) => {
  // PPM status determination
  const ppmStatus = get(ppm, 'status', 'DRAFT');
  // If an HHG_PPM move, move type will be past draft, even if PPM is still in draft status.
  if (selectedMoveType === 'HHG_PPM') {
    return ppmStatus;
  }
  return moveStatus === 'APPROVED' && (ppmStatus === 'SUBMITTED' || ppmStatus === 'DRAFT') ? 'SUBMITTED' : moveStatus;
};

const getHHGStatus = (moveStatus, shipment) => {
  // HHG status determination
  if (moveStatus === 'CANCELED') {
    // Shipment does not have a canceled status, but move does.
    return moveStatus;
  }
  const shipmentStatus = get(shipment, 'status', 'DRAFT');
  return ['SUBMITTED', 'AWARDED', 'ACCEPTED', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(
    shipmentStatus,
  )
    ? shipmentStatus
    : 'DRAFT';
};

export const MoveSummary = props => {
  const {
    context,
    profile,
    move,
    orders,
    ppm,
    shipment,
    editMove,
    entitlement,
    resumeMove,
    reviewProfile,
    requestPaymentSuccess,
    addPPMShipment,
  } = props;
  const moveStatus = get(move, 'status', 'DRAFT');
  const moveId = get(move, 'id');
  const selectedMoveType = get(move, 'selected_move_type');
  const showHHG = selectedMoveType === 'HHG' || selectedMoveType === 'HHG_PPM';
  const showPPM = selectedMoveType === 'PPM' || selectedMoveType === 'HHG_PPM';
  const hhgStatus = getHHGStatus(moveStatus, shipment);
  const HHGComponent = hhgSummaryStatusComponents[hhgStatus]; // eslint-disable-line security/detect-object-injection
  const PPMComponent = ppmSummaryStatusComponents[getPPMStatus(moveStatus, ppm, selectedMoveType)];
  const showAddShipmentLink =
    selectedMoveType === 'HHG' &&
    ['SUBMITTED', 'ACCEPTED', 'AWARDED', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(move.status);
  const showTsp =
    move.selected_move_type !== 'PPM' &&
    ['ACCEPTED', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(hhgStatus);
  return (
    <div className="move-summary">
      {move.status === 'CANCELED' && (
        <Alert type="info" heading="Your move was canceled">
          Your move from {get(profile, 'current_station.name')} to {get(orders, 'new_duty_station.name')} with the move
          locator ID {get(move, 'locator')} was canceled.
        </Alert>
      )}

      <div className="whole_box">
        {move.status !== 'CANCELED' && (
          <div>
            <MoveInfoHeader orders={orders} profile={profile} move={move} entitlement={entitlement} />
            <br />
          </div>
        )}
        <div className="usa-width-three-fourths">
          {(showHHG || (!showHHG && !showPPM)) && (
            <HHGComponent
              className="status-component"
              ppm={ppm}
              shipment={shipment}
              orders={orders}
              profile={profile}
              move={move}
              entitlement={entitlement}
              resumeMove={resumeMove}
              reviewProfile={reviewProfile}
              requestPaymentSuccess={requestPaymentSuccess}
              addPPMShipment={addPPMShipment}
            />
          )}
          {showPPM && (
            <PPMComponent
              context={context}
              className="status-component"
              ppm={ppm}
              shipment={shipment}
              orders={orders}
              profile={profile}
              move={move}
              entitlement={entitlement}
              resumeMove={resumeMove}
              reviewProfile={reviewProfile}
              requestPaymentSuccess={requestPaymentSuccess}
            />
          )}
        </div>

        <div className="sidebar usa-width-one-fourth">
          <div>
            <button
              className="usa-button-secondary"
              onClick={() => editMove(move)}
              disabled={includes(['DRAFT', 'CANCELED'], move.status)}
            >
              Edit Move
            </button>
          </div>
          <div>
            {showAddShipmentLink && (
              <button className="link" onClick={() => addPPMShipment(moveId)}>
                <FontAwesomeIcon icon={faPlus} />
                <span> Add PPM (DITY) Move</span>
              </button>
            )}
          </div>
          <div className="contact_block">
            <div className="title">Contacts</div>
            <TransportationOfficeContactInfo dutyStation={profile.current_station} isOrigin={true} />
            {hhgStatus !== 'CANCELED' && (
              <TransportationOfficeContactInfo dutyStation={get(orders, 'new_duty_station')} />
            )}
            {showTsp && <TransportationServiceProviderContactInfo shipmentId={shipment.id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

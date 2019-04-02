import React from 'react';
import { Link } from 'react-router-dom';
import PPMPaymentRequestActionBtns from './PPMPaymentRequestActionBtns';
import './PPMPaymentRequest.css';

const PPMPaymentRequestIntro = () => {
  return (
    <div className="usa-grid ppm-payment-req-intro">
      <h3 className="title">Request PPM Payment</h3>
      <p>You'll need the following documents</p>
      <ul>
        <li>
          <strong>Weight tickets</strong> both empty & full, for each vehicle and trip
        </li>
        <li>
          <strong>Storage and moving expenses</strong> (optional), such as:
          <ul>
            <li>storage</li>
            <li>tolls & weighing fees</li>
            <li>rental equipment</li>
          </ul>
        </li>
      </ul>
      <p>
        <Link to="/allowable-expenses">List of allowable expenses</Link>
      </p>
      {/* TODO: change onclick handler to go to next page in flow */}
      <PPMPaymentRequestActionBtns onClick={() => {}} nextBtnLabel="Get Started" />
    </div>
  );
};
export default PPMPaymentRequestIntro;

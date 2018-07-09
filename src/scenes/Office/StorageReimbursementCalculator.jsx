import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getFormValues } from 'redux-form';
import { getPpmSitEstimate } from '../Moves/Ppm/ducks';
import { reduxForm } from 'redux-form';
import { SwaggerField } from 'shared/JsonSchemaForm/JsonSchemaField';

const formName = 'storage_reimbursement_calc';
const schema = {
  properties: {
    planned_move_date: {
      type: 'string',
      format: 'date',
      example: '2018-04-26',
      title: 'Move Date',
      'x-nullable': true,
      'x-always-required': true,
    },
    pickup_postal_code: {
      type: 'string',
      format: 'zip',
      title: 'Pickup ZIP',
      example: '90210',
      pattern: '^(\\d{5}([\\-]\\d{4})?)$',
      'x-nullable': true,
      'x-always-required': true,
    },
    destination_postal_code: {
      type: 'string',
      format: 'zip',
      title: 'Destination ZIP',
      example: '90210',
      pattern: '^(\\d{5}([\\-]\\d{4})?)$',
      'x-nullable': true,
      'x-always-required': true,
    },
    days_in_storage: {
      type: 'integer',
      title: 'Days in Storage',
      minimum: 0,
      maximum: 90,
      'x-nullable': true,
      'x-always-required': true,
    },
    weight: {
      type: 'integer',
      minimum: 1,
      title: 'Weight',
      'x-nullable': true,
      'x-always-required': true,
    },
  },
};
export class StorageReimbursementCalculator extends Component {
  getDebouncedSitEstimate = () => {
    const {
      planned_move_date,
      pickup_postal_code,
      destination_postal_code,
      days_in_storage,
      weight,
    } = this.props.formValues;
    console.log(this.props.formValues);
    if (
      !pickup_postal_code ||
      !destination_postal_code ||
      !planned_move_date ||
      !weight
    )
      return;
    if (
      days_in_storage <= 90 &&
      pickup_postal_code.length === 5 &&
      destination_postal_code.length === 5
    ) {
      console.log('loading');
      this.props.getPpmSitEstimate(
        planned_move_date,
        days_in_storage,
        pickup_postal_code,
        destination_postal_code,
        weight,
      );
    }
  };

  render() {
    const { sitReimbursement, pristine, invalid } = this.props;
    return (
      <div className="calculator-panel">
        <div className="calculator-panel-title">
          Storage Reimbursement Calculator
        </div>
        <SwaggerField
          className="date-field"
          fieldName="planned_move_date"
          swagger={this.props.schema}
          required
        />
        <SwaggerField
          className="short-field"
          fieldName="pickup_postal_code"
          swagger={this.props.schema}
          required
        />
        <SwaggerField
          className="short-field"
          fieldName="destination_postal_code"
          swagger={this.props.schema}
          required
        />
        <SwaggerField
          className="short-field"
          fieldName="days_in_storage"
          swagger={this.props.schema}
          required
        />
        <SwaggerField
          className="short-field"
          fieldName="weight"
          swagger={this.props.schema}
          required
        />
        <button
          onClick={this.getDebouncedSitEstimate}
          disabled={pristine || invalid}
        >
          Calculate
        </button>
        {sitReimbursement && (
          <div className="calculated-result">
            Maximum Obligation: <b>{sitReimbursement}</b>
          </div>
        )}
      </div>
    );
  }
}

StorageReimbursementCalculator.propTypes = {
  schema: PropTypes.object.isRequired,
  getPpmSitEstimate: PropTypes.func.isRequired,
  error: PropTypes.object,
};

function mapStateToProps(state) {
  const props = {
    // schema: get(
    //   state,
    //   'swagger.spec.definitions.UpdatePersonallyProcuredMovePayload',
    //   {},
    // ),
    schema,
    formValues: getFormValues(formName)(state),
    hasEstimateError: state.ppm.hasEstimateError,
    ...state.ppm,
  };
  return props;
}
function mapDispatchToProps(dispatch) {
  return bindActionCreators({ getPpmSitEstimate }, dispatch);
}

export default reduxForm({ form: formName })(
  connect(mapStateToProps, mapDispatchToProps)(StorageReimbursementCalculator),
);

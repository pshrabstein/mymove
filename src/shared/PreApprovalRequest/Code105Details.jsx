import React, { Fragment } from 'react';
import { SwaggerField } from 'shared/JsonSchemaForm/JsonSchemaField';

export const Code105Details = props => {
  const { ship_line_item_schema } = props;
  return ( 
    <Fragment>
      <SwaggerField fieldName="description" swagger={ship_line_item_schema} required />
      <DimensionsField fieldName="item_dimensions" swagger={props.swagger} labelText="Item Dimensions (inches)" />
      <DimensionsField fieldName="crate_dimensions" swagger={props.swagger} labelText="Crate Dimensions (inches)" />
      <div className="bq-explanation">
        <p>Crate can only exceed item size by:</p>
        <ul>
          <li>
            <em>Internal crate</em>: Up to 3" larger
          </li>
          <li>
            <em>External crate</em>: Up to 5" larger
          </li>
        </ul>
      </div>
    </Fragment>
  );
};

import React, { Fragment } from 'react';
import { SwaggerField } from 'shared/JsonSchemaForm/JsonSchemaField';


export const Code105Details = props => {
  const { ship_line_item_schema } = props;
  return (
    <Fragment>
      <div>More to come!</div>
      <SwaggerField
        fieldName="description"
        className="three-quarter-width"
        swagger={ship_line_item_schema}
        required
      />
    </Fragment>
  );
};

import { getClient, checkResponse } from 'shared/api';

export async function GetPpm(moveId) {
  const client = await getClient();
  const response = await client.apis.ppm.indexPersonallyProcuredMoves({
    moveId,
  });
  checkResponse(response, 'failed to get ppm due to server error');
  return response.body;
}

export async function CreatePpm(
  moveId,
  payload /*shape: {size, weightEstimate, estimatedIncentive}*/,
) {
  const client = await getClient();
  const response = await client.apis.ppm.createPersonallyProcuredMove({
    moveId,
    createPersonallyProcuredMovePayload: payload,
  });
  checkResponse(response, 'failed to create ppm due to server error');
  return response.body;
}

export async function UpdatePpm(
  moveId,
  personallyProcuredMoveId,
  payload /*shape: {size, weightEstimate, estimatedIncentive}*/,
) {
  const client = await getClient();
  const response = await client.apis.ppm.patchPersonallyProcuredMove({
    moveId,
    personallyProcuredMoveId,
    patchPersonallyProcuredMovePayload: payload,
  });
  checkResponse(response, 'failed to update ppm due to server error');
  return response.body;
}

export async function GetPpmEstimate(
  moveDate,
  originZip,
  destZip,
  weightEstimate,
) {
  //TODO: make api call once data is loaded on staging and prod
  return { range_min: 75 * weightEstimate, range_max: 115 * weightEstimate };
  //  const client = await getClient();
  // const response = await client.apis.ppm.showPPMEstimate({
  //   planned_move_date: moveDate,
  //   origin_zip: originZip,
  //   destination_zip: destZip,
  //   weight_estimate: weightEstimate,
  // });
  // checkResponse(response, 'failed to update ppm due to server error');
  // return response.body;
}

package publicapi

import (
	"github.com/go-openapi/runtime/middleware"
	"github.com/go-openapi/strfmt"
	"github.com/gobuffalo/uuid"
	"go.uber.org/zap"

	"github.com/transcom/mymove/pkg/auth"
	"github.com/transcom/mymove/pkg/gen/apimessages"
	tspsop "github.com/transcom/mymove/pkg/gen/restapi/apioperations/tsps"
	"github.com/transcom/mymove/pkg/handlers"
	"github.com/transcom/mymove/pkg/models"
)

func payloadForTspModel(t models.TransportationServiceProvider) *apimessages.TransportationServiceProvider {
	tspPayload := &apimessages.TransportationServiceProvider{
		ID:                       *handlers.FmtUUID(t.ID),
		CreatedAt:                strfmt.DateTime(t.CreatedAt),
		UpdatedAt:                strfmt.DateTime(t.UpdatedAt),
		StandardCarrierAlphaCode: &t.StandardCarrierAlphaCode,
		Enrolled:                 *handlers.FmtBool(t.Enrolled),
		Name:                     t.Name,
		PocGeneralName:           t.PocGeneralName,
		PocGeneralEmail:          t.PocGeneralEmail,
		PocGeneralPhone:          t.PocGeneralPhone,
		PocClaimsName:            t.PocClaimsName,
		PocClaimsEmail:           t.PocClaimsEmail,
		PocClaimsPhone:           t.PocClaimsPhone,
	}
	return tspPayload
}

// IndexTSPsHandler returns a list of all the TSPs
type IndexTSPsHandler struct {
	handlers.HandlerContext
}

// Handle simply returns a NotImplementedError
func (h IndexTSPsHandler) Handle(params tspsop.IndexTSPsParams) middleware.Responder {
	return middleware.NotImplemented("operation .indexTSPs has not yet been implemented")
}

// GetTspHandler returns a list of all the TSPs
type GetTspHandler struct {
	handlers.HandlerContext
}

// Handle returns a single Tsp identified by ID
func (h GetTspHandler) Handle(params tspsop.GetTspParams) middleware.Responder {
	session := auth.SessionFromRequestContext(params.HTTPRequest)
	tspID, _ := uuid.FromString(params.TspID.String())

	if session.IsTspUser() {
		// TODO: (cgilmer 2018_07_25) This is an extra query we don't need to run on every request. Put the
		// TransportationServiceProviderID into the session object after refactoring the session code to be more readable.
		// See original commits in https://github.com/transcom/mymove/pull/802
		tspUser, err := models.FetchTspUserByID(h.DB(), session.TspUserID)
		if err != nil {
			h.Logger().Error("DB Query", zap.Error(err))
			return tspsop.NewGetTspForbidden()
		}
		if tspUser.TransportationServiceProviderID != tspID {
			h.Logger().Error("Error fetching TSP for TSP user", zap.Error(err))
			return tspsop.NewGetTspForbidden()
		}
	}

	tsp, err := models.FetchTsp(h.DB(), tspID)
	if err != nil {
		h.Logger().Error("DB Query", zap.Error(err))
		return tspsop.NewGetTspBadRequest()
	}

	tspp := payloadForTspModel(*tsp)
	return tspsop.NewGetTspOK().WithPayload(tspp)
}

// GetTspShipmentsHandler lists all the shipments that belong to a tsp
type GetTspShipmentsHandler struct {
	handlers.HandlerContext
}

// Handle simply returns a NotImplementedError
func (h GetTspShipmentsHandler) Handle(params tspsop.GetTspShipmentsParams) middleware.Responder {
	return middleware.NotImplemented("operation .tspShipments has not yet been implemented")
}

// GetTspBlackoutsHandler lists all the shipments that belong to a tsp
type GetTspBlackoutsHandler struct {
	handlers.HandlerContext
}

// Handle simply returns a NotImplementedError
func (h GetTspBlackoutsHandler) Handle(params tspsop.GetTspShipmentsParams) middleware.Responder {
	return middleware.NotImplemented("operation .tspShipments has not yet been implemented")
}

package publicapi

import (
	"reflect"

	"github.com/go-openapi/runtime/middleware"
	"github.com/gofrs/uuid"
	beeline "github.com/honeycombio/beeline-go"
	"go.uber.org/zap"

	"github.com/transcom/mymove/pkg/auth"
	"github.com/transcom/mymove/pkg/gen/apimessages"
	accessorialop "github.com/transcom/mymove/pkg/gen/restapi/apioperations/accessorials"
	"github.com/transcom/mymove/pkg/handlers"
	"github.com/transcom/mymove/pkg/models"
)

func payloadForInvoiceModels(a []models.Invoice) apimessages.Invoices {
	payloads := make(apimessages.Invoices, len(a))

	for i, acc := range a {
		payloads[i] = payloadForInvoiceModel(&acc)
	}

	return payloads
}

func payloadForInvoiceModel(a *models.Invoice) *apimessages.Invoice {
	if a == nil {
		return nil
	}

	return &apimessages.Invoice{
		ID:                *handlers.FmtUUID(a.ID),
		ShipmentID:        *handlers.FmtUUID(a.ShipmentID),
		InvoiceNumber:     a.InvoiceNumber,
		ApproverFirstName: a.Approver.FirstName,
		ApproverLastName:  a.Approver.LastName,
		Status:            apimessages.InvoiceStatus(a.Status),
		InvoicedDate:      *handlers.FmtDateTime(a.InvoicedDate),
	}
}

// GetInvoiceHandler returns an invoice
type GetInvoiceHandler struct {
	handlers.HandlerContext
}

// Handle returns a specified invoice
func (h GetInvoiceHandler) Handle(params accessorialop.GetInvoiceParams) middleware.Responder {
	ctx, span := beeline.StartSpan(params.HTTPRequest.Context(), reflect.TypeOf(h).Name())
	defer span.Send()

	session := auth.SessionFromRequestContext(params.HTTPRequest)

	if session == nil {
		return accessorialop.NewGetInvoiceUnauthorized()
	}

	// Fetch invoice
	invoiceID, _ := uuid.FromString(params.InvoiceID.String())
	invoice, err := models.FetchInvoice(h.DB(), session, invoiceID)
	if err != nil {
		if err == models.ErrFetchNotFound {
			h.Logger().Warn("Invoice not found", zap.Error(err))
			return h.RespondAndTraceError(ctx, err, "error invoice not found")
		} else if err == models.ErrFetchForbidden {
			h.Logger().Error("User not permitted to access invoice", zap.Error(err))
			return h.RespondAndTraceError(ctx, err, "error user not permitted to access invoice")
		} else if err == models.ErrUserUnauthorized {
			h.Logger().Error("User not authorized to access invoice", zap.Error(err))
			return h.RespondAndTraceError(ctx, err, "error user not authorized to access invoice")
		}

		h.Logger().Error("Error fetching invoice", zap.Error(err))
		return h.RespondAndTraceError(ctx, err, "error fetching invoice")
	}

	payload := payloadForInvoiceModel(invoice)
	return accessorialop.NewGetInvoiceOK().WithPayload(payload)
}

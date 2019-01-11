package invoice

import (
	"os"

	"github.com/facebookgo/clock"
	"github.com/gobuffalo/pop"
	"github.com/gobuffalo/validate"
	"github.com/pkg/errors"

	"github.com/transcom/mymove/pkg/edi"
	"github.com/transcom/mymove/pkg/edi/gex"
	ediinvoice "github.com/transcom/mymove/pkg/edi/invoice"
	"github.com/transcom/mymove/pkg/models"
)

// ProcessInvoice is a service object to invoices into the Submitted state
type ProcessInvoice struct {
	DB        *pop.Connection
	GexSender gex.SendToGex
}

// Call updates the Invoice to InvoiceStatusSUBMITTED and updates its ShipmentLineItem associations
func (u ProcessInvoice) Call(shipment *models.Shipment, invoice *models.Invoice, sendProdInvoice bool) (*validate.Errors, error) {
	if err := u.makeGexRequest(shipment, invoice, sendProdInvoice); err != nil {
		// Update invoice record as failed
		invoice.Status = models.InvoiceStatusSUBMISSIONFAILURE
		verrs, saveErr := u.DB.ValidateAndSave(invoice)
		if saveErr != nil {
			return verrs, errors.Wrap(err, "something")
		}
	}

	// Update invoice record as submitted
	shipmentLineItems := shipment.ShipmentLineItems
	verrs, err := UpdateInvoiceSubmitted{DB: u.DB}.Call(invoice, shipmentLineItems)
	if err != nil || verrs.HasAny() {
		// Update invoice record as failed
		invoice.Status = models.InvoiceStatusSUBMISSIONFAILURE
		saveVerrs, saveErr := u.DB.ValidateAndSave(invoice)
		if saveErr != nil; saveVerrs.HasAny() {
			verrs.Append(saveVerrs)
			// TODO handle both errors gracefully
			err = errors.Wrap(err, "this is bad")
		}

		return verrs, err
	}

	return validate.NewErrors(), nil
}

func (u ProcessInvoice) makeGexRequest(shipment *models.Shipment, invoice *models.Invoice, sendProdInvoice bool) error {
	// pass value into generator --> edi string
	invoice858C, err := ediinvoice.Generate858C(*shipment, *invoice, u.DB, sendProdInvoice, clock.New())
	if err != nil {
		return err
	}
	// to use for demo visual
	// should this have a flag or be taken out?
	ediWriter := edi.NewWriter(os.Stdout)
	ediWriter.WriteAll(invoice858C.Segments())

	// send edi through gex post api
	transactionName := "placeholder"
	invoice858CString, err := invoice858C.EDIString()
	if err != nil {
		return err
	}

	resp, err := u.GexSender.Call(invoice858CString, transactionName)
	if err != nil {
		return err
	}

	// get response from gex --> use status as status for this invoice call
	if resp.StatusCode != 200 {
		return errors.Errorf("Invoice POST request to GEX failed: status code %d", resp.StatusCode)
	}

	return nil
}

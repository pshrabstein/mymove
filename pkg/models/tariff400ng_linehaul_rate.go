package models

import (
	"fmt"
	"time"

	"github.com/gobuffalo/pop"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
	"github.com/gofrs/uuid"

	"github.com/transcom/mymove/pkg/unit"
)

// Tariff400ngLinehaulRate describes the rate paids paid to transport various weights of goods
// various distances.
type Tariff400ngLinehaulRate struct {
	ID                 uuid.UUID  `json:"id" db:"id"`
	CreatedAt          time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at" db:"updated_at"`
	DistanceMilesLower int        `json:"distance_miles_lower" db:"distance_miles_lower"`
	DistanceMilesUpper int        `json:"distance_miles_upper" db:"distance_miles_upper"`
	Type               string     `json:"type" db:"type"`
	WeightLbsLower     unit.Pound `json:"weight_lbs_lower" db:"weight_lbs_lower"`
	WeightLbsUpper     unit.Pound `json:"weight_lbs_upper" db:"weight_lbs_upper"`
	RateCents          unit.Cents `json:"rate_cents" db:"rate_cents"`
	EffectiveDateLower time.Time  `json:"effective_date_lower" db:"effective_date_lower"`
	EffectiveDateUpper time.Time  `json:"effective_date_upper" db:"effective_date_upper"`
}

// Tariff400ngLinehaulRates is not required by pop and may be deleted
type Tariff400ngLinehaulRates []Tariff400ngLinehaulRate

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (t *Tariff400ngLinehaulRate) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.IntIsGreaterThan{Field: t.RateCents.Int(), Name: "RateCents", Compared: -1},
		&validators.IntIsLessThan{Field: t.DistanceMilesLower, Name: "DistanceMilesLower",
			Compared: t.DistanceMilesUpper},
		&validators.IntIsLessThan{Field: t.WeightLbsLower.Int(), Name: "WeightLbsLower",
			Compared: t.WeightLbsUpper.Int()},
		&validators.TimeAfterTime{
			FirstTime: t.EffectiveDateUpper, FirstName: "EffectiveDateUpper",
			SecondTime: t.EffectiveDateLower, SecondName: "EffectiveDateLower"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (t *Tariff400ngLinehaulRate) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (t *Tariff400ngLinehaulRate) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// FetchBaseLinehaulRate takes a move's distance and weight and queries the tariff400ng_linehaul_rates table to find a move's base linehaul rate.
func FetchBaseLinehaulRate(tx *pop.Connection, mileage int, weight unit.Pound, date time.Time) (linehaulRate unit.Cents, err error) {
	// TODO: change to a parameter once we're serving more move types
	moveType := "ConusLinehaul"
	var linehaulRates []unit.Cents

	sql := `SELECT
		rate_cents
	FROM
		tariff400ng_linehaul_rates
	WHERE
		(distance_miles_lower <= $1 AND $1 < distance_miles_upper)
	AND
		(weight_lbs_lower <= $2 AND $2 < weight_lbs_upper)
	AND
		type = $3
	AND
		(effective_date_lower <= $4 AND $4 < effective_date_upper);`

	err = tx.RawQuery(sql, mileage, weight.Int(), moveType, date).All(&linehaulRates)

	if err != nil {
		return 0, fmt.Errorf("Error fetching linehaul rate: %s", err)
	}
	if len(linehaulRates) != 1 {
		return 0, fmt.Errorf("Wanted 1 rate, found %d rates for parameters: %v, %v, %v",
			len(linehaulRates), mileage, weight, date)
	}

	//if no rate is found then query to determine which filter failed and throw an error based on it
	if len(linehaulRates) == 0 {
		err = validateLineHaulRate(tx, mileage, weight, date, moveType)
	}

	return linehaulRates[0], err
}

func validateLineHaulRate(tx *pop.Connection, mileage int, weight unit.Pound, date time.Time, moveType string) (err error) {
	var linehaulRates []unit.Cents
	//filter by distance
	filterByDistance := `SELECT
						rate_cents
					FROM
						tariff400ng_linehaul_rates
					WHERE
						(distance_miles_lower <= $1 AND $1 < distance_miles_upper);`
	err = tx.RawQuery(filterByDistance, mileage).All(&linehaulRates)
	if err != nil {
		return fmt.Errorf("error fetching linehaul rate: %s", err)
	}
	if len(linehaulRates) < 1 {
		//throw error stating rate can't be found because of distance
		return fmt.Errorf("no rate found for the distance: %d", mileage)

	}

	//filter by weight
	filterByWeight := `SELECT
						rate_cents
					FROM
						tariff400ng_linehaul_rates
					WHERE
						(weight_lbs_lower <= $1 AND $1 < weight_lbs_upper)`
	err = tx.RawQuery(filterByWeight, weight).All(&linehaulRates)
	if err != nil {
		return fmt.Errorf("error fetching linehaul rate: %s", err)
	}
	if len(linehaulRates) < 1 {
		//throw error stating rate can't be found because of weight
		return fmt.Errorf("no rate found for the weight class: %d", weight)
	}

	//filter by type
	filterByType := `SELECT
						rate_cents
					FROM
						tariff400ng_linehaul_rates
					WHERE
						type = $1`
	err = tx.RawQuery(filterByType, moveType).All(&linehaulRates)
	if err != nil {
		return fmt.Errorf("error fetching linehaul rate: %s", err)
	}
	if len(linehaulRates) < 1 {
		//throw error stating rate can't be found because of type
		return fmt.Errorf("no rate found for the type: %s", moveType)
	}

	//filter by type
	filterByDate := `SELECT
						rate_cents
					FROM
						tariff400ng_linehaul_rates
					WHERE
						(effective_date_lower <= $1 AND $1 < effective_date_upper);`
	err = tx.RawQuery(filterByDate, date).All(&linehaulRates)
	if err != nil {
		return fmt.Errorf("Error fetching linehaul rate: %s", err)
	}
	if len(linehaulRates) < 1 {
		//throw error stating rate can't be found because of dates
		return fmt.Errorf("no rate found for the date: %s", date)
	}
	return nil
}

package models_test

import (
	"fmt"
	"time"

	. "github.com/transcom/mymove/pkg/models"
)

type rateEngineDateTestCase struct {
	days    []time.Time
	ppStart time.Time
	ppEnd   time.Time
	rpStart time.Time
	rpEnd   time.Time
	peak    bool
}

func (suite *ModelSuite) Test_RateEngineDatePerformancePeriod1() {

	cases := []rateEngineDateTestCase{
		// performance period 1
		{[]time.Time{
			date(2018, time.May, 15),
			date(2018, time.June, 1),
			date(2018, time.July, 1),
			date(2018, time.July, 31)},

			date(2018, time.May, 15), date(2018, time.July, 31), date(2018, time.May, 15), date(2018, time.September, 30), true},

		// TODO: add test cases for other performance periods

		// performance period 3
		{[]time.Time{date(2018, time.October, 5)},
			date(2018, time.October, 1), date(2018, time.December, 31), date(2018, time.October, 1), date(2019, time.May, 14), false},
	}

	for _, c := range cases {
		for _, day := range c.days {
			msg := fmt.Sprintf("wrong value for input %s", day)
			red, err := NewRateEngineDate(day)
			suite.Nil(err, msg)

			suite.Equal(day, red.Date, msg)

			suite.Equal(c.ppStart, red.PerformancePeriod.Start, msg)
			suite.Equal(c.ppEnd, red.PerformancePeriod.End, msg)

			suite.Equal(c.rpStart, red.RatePeriod.Start, msg)
			suite.Equal(c.rpEnd, red.RatePeriod.End, msg)

			suite.Equal(c.peak, red.PerformancePeriod.Peak, msg)
			suite.Equal(c.peak, red.RatePeriod.Peak, msg)
		}
	}
}

func date(year int, month time.Month, day int) time.Time {
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

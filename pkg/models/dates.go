package models

import "time"

type day struct {
	month time.Month
	day   int
}

type period struct {
	start day
	end   day
	peak  bool
}

func (p period) contains(date time.Time) bool {
	// TODO: compare incoming date with p.start and p.end
	return false
}

var performancePeriods = []period{
	{day{time.May, 15}, day{time.July, 31}, true},
	{day{time.August, 1}, day{time.September, 30}, true},
	{day{time.October, 1}, day{time.December, 31}, false},
	{day{time.January, 1}, day{time.March, 6}, false},
	{day{time.March, 7}, day{time.May, 14}, false},
}

var ratePeriods = []period{
	{day{time.May, 15}, day{time.September, 30}, true},
	{day{time.October, 1}, day{time.May, 14}, false},
}

type Period struct {
	Start time.Time
	End   time.Time
	Peak  bool
}

type RateEngineDate struct {
	Date              time.Time
	PerformancePeriod Period
	RatePeriod        Period
}

func (p Period) DateDuring() time.Time {
	return time.Date(2018, time.October, 1, 0, 0, 0, 0, time.UTC)
}

func (p Period) DateAfter() time.Time {
	return time.Date(2018, time.October, 1, 0, 0, 0, 0, time.UTC)
}

func (p Period) DateBefore() time.Time {
	return time.Date(2018, time.October, 1, 0, 0, 0, 0, time.UTC)
}

func NewRateEngineDate(date time.Time) (RateEngineDate, error) {
	red := RateEngineDate{
		Date:              date,
		PerformancePeriod: performancePeriodContaining(date),
		RatePeriod:        ratePeriodContaining(date),
	}
	return red, nil
}

func performancePeriodContaining(date time.Time) Period {
	var containing period
	for _, p := range performancePeriods {
		if p.contains(date) {
			containing = p
			break
		}
	}

	return Period{
		Start: createDate(date.Year(), containing.start),
		End:   createDate(date.Year(), containing.end),
		Peak:  containing.peak,
	}
}

func ratePeriodContaining(date time.Time) Period {
	day := date.Day()
	month := date.Month()

	peakPeriod := ratePeriods[0]
	nonpeakPeriod := ratePeriods[1]

	p := Period{}
	if peakPeriod.start.month <= month && peakPeriod.start.day <= day &&
		peakPeriod.end.month >= month && peakPeriod.end.day >= day {
		p.Start = createDate(date.Year(), peakPeriod.start)
		p.End = createDate(date.Year(), peakPeriod.end)
		p.Peak = peakPeriod.peak
	} else {
		var startYear, endYear int
		if month <= nonpeakPeriod.end.month {
			startYear = date.Year() - 1
			endYear = date.Year()
		} else {
			startYear = date.Year()
			endYear = date.Year() + 1
		}
		p.Start = createDate(startYear, nonpeakPeriod.start)
		p.End = createDate(endYear, nonpeakPeriod.end)
	}
	return p
}

func createDate(year int, day day) time.Time {
	return time.Date(year, day.month, day.day, 0, 0, 0, 0, time.UTC)
}

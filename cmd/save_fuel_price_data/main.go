package main

import (
	"log"
	"os"
	"strings"

	"github.com/facebookgo/clock"
	"github.com/gobuffalo/pop"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"

	"github.com/transcom/mymove/pkg/services/fuelprice"
)

// Command: go run cmd/save_fuel_price_data/main.go
func main() {

	flag := pflag.CommandLine

	flag.String("eia-key", "", "key for Energy Information Administration (EIA) api")
	flag.String("eia-url", "", "url for EIA api")
	flag.Parse(os.Args[1:])

	v := viper.New()
	v.BindPFlags(flag)
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	v.AutomaticEnv()

	db, err := pop.Connect("development")
	if err != nil {
		log.Fatal(err)
	}
	clock := clock.New()
	fuelPrices := fuelprice.NewDieselFuelPriceStorer(
		db,
		clock,
		fuelprice.FetchFuelPriceData,
		v.GetString("eia-key"),
		v.GetString("eia-url"),
	)

	verrs, err := fuelPrices.StoreFuelPrices(10)
	if err != nil || verrs != nil {
		log.Fatal(err, verrs)
	}
}

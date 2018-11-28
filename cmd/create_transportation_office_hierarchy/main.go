package main

import (
	"bufio"
	"encoding/csv"
	"flag"
	"fmt"
	"github.com/gobuffalo/uuid"
	"github.com/transcom/mymove/pkg/models"
	"github.com/transcom/mymove/pkg/route"
	"go.uber.org/zap"
	"io"
	"log"
	"os"
	"text/template"
)

type jppso struct {
	ID      uuid.UUID
	Gbloc   string
	Name    string
	Address *models.Address
	LatLong *route.LatLong
}

func main() {
	const sql = `
	-Add {{.Name}} transportation offices and addresses
	INSERT INTO addresses
		(id, street_address_1, street_address_2, city, state, postal_code, created_at, updated_at, country)
		VALUES ('{{.Address.ID}}', '{{.Address.StreetAddr1}}', '{{.Address.StreetAddr2}}', '{{.Address.City}}', '{{.Address.State}}', '{{.Address.PostalCode}}', now(), now(), 'United States');
	INSERT INTO transportation_offices
		(id, name, gbloc, address_id, latitude, longitude, created_at, updated_at)
		VALUES ('{{.ID}}', '{{.Name}}', '{{.Gbloc}}', '{{.Address.ID}}', 38.7037, -77.1481, now(), now());
	--Update all PPPOs with relating gbloc
	UPDATE transportation_offices
		SET shipping_office_id = '{{.ID}}' WHERE gbloc='{{.Gbloc}}' AND id <> '{{.ID}}';
			`
	// Create a new template and parse the sql into it.
	t := template.Must(template.New("sql").Parse(sql))
	hereGeoEndpoint := flag.String("here_maps_geocode_endpoint", "", "URL for the HERE maps geocoder endpoint")
	hereRouteEndpoint := flag.String("here_maps_routing_endpoint", "", "URL for the HERE maps routing endpoint")
	hereAppID := flag.String("here_maps_app_id", "", "HERE maps App ID for this application")
	hereAppCode := flag.String("here_maps_app_code", "", "HERE maps App API code")
	flag.Parse()
	logger, err := zap.NewDevelopment()
	if err != nil {
		log.Fatalf("Failed to initialize Zap logging due to %v", err)
	}

	fmt.Println(os.Getenv("HERE_MAPS_GEOCODE_ENDPOINT"))
	fmt.Println("test")

	os.Exit(hereGeoEndpoint)

	planner := route.NewHEREPlanner(logger, hereGeoEndpoint, hereRouteEndpoint, hereAppID, hereAppCode)
	csvFile, _ := os.Open("jppsos.csv")
	reader := csv.NewReader(bufio.NewReader(csvFile))
	var jppsos []jppso
	for {
		line, error := reader.Read()
		if error == io.EOF {
			break
		} else if error != nil {
			log.Fatal(error)
		}

		jppsoID, err := uuid.NewV4()
		if err != nil {
			log.Fatal(err)
		}
		addressID, err2 := uuid.NewV4()
		if err2 != nil {
			log.Fatal(err2)
		}
		// initialize address object
		addressSource := models.Address{
			ID:             addressID,
			StreetAddress1: line[3],
			City:           line[4],
			State:          line[5],
			PostalCode:     line[6],
		}

		response := make(chan route.AddressLatLong)
		go planner.GetAddressLatLong(response, &addressSource)
		info := <-response
		fmt.Print(info)
		thisJppso := jppso{
			ID:      jppsoID,
			Gbloc:   line[0],
			Name:    line[1],
			Address: &addressSource,
			//LatLong: info.location,
		}
		jppsos = append(jppsos, thisJppso)
	}
	for _, jppso := range jppsos {
		err := t.Execute(os.Stdout, jppso)
		if err != nil {
			log.Println("executing template:", err)
		}
	}
}

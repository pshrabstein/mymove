package main

import (
	"bufio"
	"encoding/csv"
	"io"
	"log"
	"os"
	"text/template"

	"github.com/gobuffalo/uuid"
)

type jppso struct {
	ID      uuid.UUID `json:"id"`
	Gbloc   string    `json:"gbloc"`
	Name    string    `json:"name"`
	Address *address  `json:"address,omitempty"`
}

type address struct {
	ID          uuid.UUID `json:"id"`
	StreetAddr1 string    `json: "street_addr_1"`
	StreetAddr2 string    `json: "street_addr_2"`
	City        string    `json:"city"`
	State       string    `json:"state"`
	PostalCode  string    `json:"postal_code"`
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
	// hereGeoEndpoint := flag.String("here_maps_geocode_endpoint", "", "URL for the HERE maps geocoder endpoint")
	// hereRouteEndpoint := flag.String("here_maps_routing_endpoint", "", "URL for the HERE maps routing endpoint")
	// hereAppID := flag.String("here_maps_app_id", "", "HERE maps App ID for this application")
	// hereAppCode := flag.String("here_maps_app_code", "", "HERE maps App API code")
	// flag.Parse()
	// logger, err := zap.NewDevelopment()
	// if err != nil {
	// 	log.Fatalf("Failed to initialize Zap logging due to %v", err)
	// }

	//	planner := route.NewHEREPlanner(logger, hereGeoEndpoint, hereRouteEndpoint, hereAppID, hereAppCode)
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
		// response := make(chan addressLatLong)
		// var srcLatLong LatLong
		// go p.GetAddressLatLong(response, source)
		jppsos = append(jppsos, jppso{
			ID:    jppsoID,
			Gbloc: line[0],
			Name:  line[1],
			Address: &address{
				ID:          addressID,
				StreetAddr1: line[2],
				StreetAddr2: line[3],
				City:        line[4],
				State:       line[5],
				PostalCode:  line[6],
			},
		})
	}
	for _, jppso := range jppsos {
		err := t.Execute(os.Stdout, jppso)
		if err != nil {
			log.Println("executing template:", err)
		}
	}
}

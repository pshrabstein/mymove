package models

import (
	"time"

	"github.com/gobuffalo/pop"
	"github.com/gobuffalo/uuid"
	"github.com/transcom/mymove/pkg/gen/internalmessages"
)

// MoveQueueItem represents a single move queue item within a queue.
type MoveQueueItem struct {
	ID               uuid.UUID                           `json:"id" db:"id"`
	CreatedAt        time.Time                           `json:"created_at" db:"created_at"`
	Edipi            string                              `json:"edipi" db:"edipi"`
	Rank             *internalmessages.ServiceMemberRank `json:"rank" db:"rank"`
	CustomerName     string                              `json:"customer_name" db:"customer_name"`
	Locator          string                              `json:"locator" db:"locator"`
	Status           string                              `json:"status" db:"status"`
	PpmStatus        *string                             `json:"ppm_status" db:"ppm_status"`
	HhgStatus        *string                             `json:"hhg_status" db:"hhg_status"`
	OrdersType       string                              `json:"orders_type" db:"orders_type"`
	MoveDate         *time.Time                          `json:"move_date" db:"move_date"`
	CustomerDeadline time.Time                           `json:"customer_deadline" db:"customer_deadline"`
	LastModifiedDate time.Time                           `json:"last_modified_date" db:"last_modified_date"`
	LastModifiedName string                              `json:"last_modified_name" db:"last_modified_name"`
}

// GetMoveQueueItems gets all moveQueueItems for a specific lifecycleState
func GetMoveQueueItems(db *pop.Connection, lifecycleState string) ([]MoveQueueItem, error) {
	var moveQueueItems []MoveQueueItem
	// TODO: add clause `JOIN personally_procured_moves AS ppm ON moves.id = ppm.move_id`
	var query string

	if lifecycleState == "new" {
		query = `
			SELECT moves.ID,
				COALESCE(sm.edipi, '*missing*') as edipi,
				COALESCE(sm.rank, '*missing*') as rank,
				CONCAT(COALESCE(sm.last_name, '*missing*'), ', ', COALESCE(sm.first_name, '*missing*')) AS customer_name,
				moves.locator as locator,
				ord.orders_type as orders_type,
				ppm.planned_move_date as move_date,
				moves.created_at as created_at,
				moves.updated_at as last_modified_date,
				moves.status as status,
				ppm.status as ppm_status
			FROM moves
			JOIN orders as ord ON moves.orders_id = ord.id
			JOIN service_members AS sm ON ord.service_member_id = sm.id
			LEFT JOIN personally_procured_moves AS ppm ON moves.id = ppm.move_id
			WHERE moves.status = 'SUBMITTED'
		`
	} else if lifecycleState == "ppm" {
		query = `
			SELECT moves.ID,
				COALESCE(sm.edipi, '*missing*') as edipi,
				COALESCE(sm.rank, '*missing*') as rank,
				CONCAT(COALESCE(sm.last_name, '*missing*'), ', ', COALESCE(sm.first_name, '*missing*')) AS customer_name,
				moves.locator as locator,
				ord.orders_type as orders_type,
				ppm.planned_move_date as move_date,
				moves.created_at as created_at,
				moves.updated_at as last_modified_date,
				moves.status as status,
				ppm.status as ppm_status
			FROM moves
			JOIN orders as ord ON moves.orders_id = ord.id
			JOIN service_members AS sm ON ord.service_member_id = sm.id
			LEFT JOIN personally_procured_moves AS ppm ON moves.id = ppm.move_id
			WHERE moves.status = 'APPROVED'
		`
	} else if lifecycleState == "hhg_accepted" {
		query = `
			SELECT shipments.ID,
				COALESCE(sm.edipi, '*missing*') as edipi,
				COALESCE(sm.rank, '*missing*') as rank,
				CONCAT(COALESCE(sm.last_name, '*missing*'), ', ', COALESCE(sm.first_name, '*missing*')) AS customer_name,
				move.locator as locator,
				ord.orders_type as orders_type,
				shipments.pickup_date as move_date,
				shipments.created_at as created_at,
				shipments.updated_at as last_modified_date,
				move.status as status,
				shipments.status as hhg_status
			FROM shipments
			JOIN moves as move ON shipments.move_id = move.id
			JOIN orders as ord ON move.orders_id = ord.id
			JOIN service_members AS sm ON ord.service_member_id = sm.id
			WHERE shipments.status = 'ACCEPTED'
		`
	} else if lifecycleState == "all" {
		query = `
			SELECT moves.ID,
				COALESCE(sm.edipi, '*missing*') as edipi,
				COALESCE(sm.rank, '*missing*') as rank,
				CONCAT(COALESCE(sm.last_name, '*missing*'), ', ', COALESCE(sm.first_name, '*missing*')) AS customer_name,
				moves.locator as locator,
				ord.orders_type as orders_type,
				ppm.planned_move_date as move_date,
				moves.created_at as created_at,
				moves.updated_at as last_modified_date,
				moves.status as status,
				ppm.status as ppm_status
			FROM moves
			JOIN orders as ord ON moves.orders_id = ord.id
			JOIN service_members AS sm ON ord.service_member_id = sm.id
			LEFT JOIN personally_procured_moves AS ppm ON moves.id = ppm.move_id
		`
	}

	err := db.RawQuery(query).All(&moveQueueItems)
	return moveQueueItems, err
}

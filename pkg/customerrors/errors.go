package customerrors

import "go.uber.org/zap"

// HTTPError is used for errors when using the "net/http" package
type HTTPError interface {
	error
	LogFields() []zap.Field
	IsClientError() bool
	AddLogFields(...zap.Field)
}

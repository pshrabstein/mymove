package customerrors

import (
	"io/ioutil"
	"net/http"

	"go.uber.org/zap"
)

type httpError struct {
	error
	err       error
	response  *http.Response
	logFields []zap.Field
}

// NewHTTPError returns a new httpError struct
func NewHTTPError(err error, response *http.Response) HTTPError {
	return httpError{
		err:      err,
		response: response,
	}
}

func (h httpError) Error() string {
	return ""
}

func (h httpError) LogFields() []zap.Field {
	fields := []zap.Field{zap.Error(h.err)}

	bodyBytes, err := ioutil.ReadAll(h.response.Body)
	if err == nil {
		fields = append(fields, zap.String("response_body", string(bodyBytes)))
	}

	fields = append(fields, h.logFields...)

	return fields
}

func (h httpError) AddLogFields(f ...zap.Field) {
	h.logFields = append(h.logFields, f...)
}

func (h httpError) IsClientError() bool {
	return h.response.StatusCode >= 400 && h.response.StatusCode < 500
}

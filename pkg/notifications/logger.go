package notifications

import (
	"go.uber.org/zap"
)

// Logger is an interface that describes the logging requirements of this package.
type Logger interface {
	Debug(msg string, fields ...zap.Field)
	Info(msg string, fields ...zap.Field)
	Error(msg string, fields ...zap.Field)
}

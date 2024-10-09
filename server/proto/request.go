package proto

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	log "github.com/sirupsen/logrus"
)

var env = os.Getenv(gin.EnvGinMode)

// ValidateRequest Validates request parameters.
func ValidateRequest(req interface{}) error {
	validate := validator.New()

	if err := validate.Struct(req); err != nil {
		log.Errorf("validate request failed, err: %s", err)
		return err
	}

	if env == "" || env == "debug" {
		log.Debugf("request: %+v\n", req)
	}

	return nil
}

// ParseQueryRequest Validates GET requests.
func ParseQueryRequest(c *gin.Context, req interface{}) error {
	var err error
	if err = c.ShouldBindQuery(req); err != nil {
		log.Errorf("parse request failed, err: %s", err)
		return err
	}

	return ValidateRequest(req)
}

// ParseFormRequest Validates POST Requests.
func ParseFormRequest(c *gin.Context, req interface{}) error {
	var err error
	if err = c.ShouldBind(req); err != nil {
		log.Errorf("parse request failed, err: %s", err)
		return err
	}

	return ValidateRequest(req)
}

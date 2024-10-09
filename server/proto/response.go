package proto

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code int         `json:"code"` // Status code. 0-success, others-failure
	Msg  string      `json:"msg"`  // Status details
	Data interface{} `json:"data"` // Returned data
}

func (r *Response) Ok() {
	r.Code = 0
	r.Msg = "success"
}

func (r *Response) OkWithData(data interface{}) {
	r.Ok()
	r.Data = data
}

func (r *Response) Err(code int, msg string) {
	r.Code = code
	r.Msg = msg
}

// OkRsp Successful response without data.
func (r *Response) OkRsp(c *gin.Context) {
	r.Ok()

	c.JSON(http.StatusOK, r)
}

// OkRspWithData Successful response with data.
func (r *Response) OkRspWithData(c *gin.Context, data interface{}) {
	r.Ok()
	r.Data = data

	c.JSON(http.StatusOK, r)
}

// ErrRsp Failed response.
func (r *Response) ErrRsp(c *gin.Context, code int, msg string) {
	r.Err(code, msg)

	c.JSON(http.StatusOK, r)
}

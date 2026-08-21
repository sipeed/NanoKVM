package proto

type LoginReq struct {
	Username string `json:"username" form:"username" validate:"required"`
	Password string `json:"password" form:"password" validate:"required"`
}

// LoginRsp is returned only when the client explicitly requests an automation
// token with the X-NanoKVM-Return-Token header. Browser logins use the
// HttpOnly session cookie and receive the normal empty success response.
type LoginRsp struct {
	Token string `json:"token"`
}

type GetAccountRsp struct {
	Username string `json:"username"`
	Role     string `json:"role"`
}

type ChangePasswordReq struct {
	CurrentPassword string `json:"currentPassword" form:"currentPassword"`
	Password        string `json:"password" form:"password" validate:"required"`
}

type IsPasswordUpdatedRsp struct {
	IsUpdated bool `json:"isUpdated"`
}

type UserInfo struct {
	Username      string `json:"username"`
	Role          string `json:"role"`
	Enabled       bool   `json:"enabled"`
	SystemAccount bool   `json:"systemAccount,omitempty"`
}

type ListUsersRsp struct {
	Users []UserInfo `json:"users"`
}

type CreateUserReq struct {
	Username string `json:"username" form:"username" validate:"required"`
	Password string `json:"password" form:"password" validate:"required"`
	Role     string `json:"role" form:"role" validate:"required"`
}

type UpdateUserReq struct {
	Username *string `json:"username" form:"username"`
	Role     *string `json:"role" form:"role"`
	Enabled  *bool   `json:"enabled" form:"enabled"`
}

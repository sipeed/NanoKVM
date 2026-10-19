package proto

type LoginReq struct {
	Username string `validate:"required"`
	Password string `validate:"required"`
}

type GetAccountRsp struct {
	Username    string   `json:"username"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
}

type ChangePasswordReq struct {
	CurrentPassword string `json:"currentPassword"`
	Password        string `json:"password" validate:"required"`
}

type IsPasswordUpdatedRsp struct {
	IsUpdated bool `json:"isUpdated"`
}

type UserInfo struct {
	Username      string   `json:"username"`
	Role          string   `json:"role"`
	Enabled       bool     `json:"enabled"`
	Permissions   []string `json:"permissions"`
	SystemAccount bool     `json:"systemAccount,omitempty"`
}

type ListPermissionsRsp struct {
	Permissions []string `json:"permissions"`
}

type ListUsersRsp struct {
	Users []UserInfo `json:"users"`
}

type CreateUserReq struct {
	Username    string   `json:"username" validate:"required"`
	Password    string   `json:"password" validate:"required"`
	Role        string   `json:"role" validate:"required"`
	Permissions []string `json:"permissions"`
}

type UpdateUserReq struct {
	Role        *string   `json:"role"`
	Enabled     *bool     `json:"enabled"`
	Permissions *[]string `json:"permissions"`
}

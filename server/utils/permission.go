package utils

import "os"

func HasPermission(filePath string, perm os.FileMode) (bool, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return false, err
	}

	mode := fileInfo.Mode().Perm()
	if mode&perm == perm {
		return true, nil
	}

	return false, nil
}

func AddPermission(filePath string, perm os.FileMode) error {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return err
	}

	mode := fileInfo.Mode() | perm
	err = os.Chmod(filePath, mode)
	if err != nil {
		return err
	}

	return nil
}

func EnsurePermission(filePath string, perm os.FileMode) error {
	hasPerm, err := HasPermission(filePath, perm)
	if err != nil {
		return err
	}

	if !hasPerm {
		err = AddPermission(filePath, perm)
		if err != nil {
			return err
		}
	}

	return nil
}

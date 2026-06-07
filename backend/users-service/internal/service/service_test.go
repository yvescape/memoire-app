package service_test

import (
	"crypto/rand"
	"crypto/rsa"
	"errors"
	"testing"

	"golang.org/x/crypto/bcrypt"
	"users-service/internal/models"
	"users-service/internal/service"
	"users-service/internal/testutil"
)

func newTestKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("cannot generate RSA key: %v", err)
	}
	return key
}

func TestRegister_HappyPath(t *testing.T) {
	mock := &testutil.MockUserRepo{}
	svc := service.NewUserService(mock, newTestKey(t))
	input := service.RegisterInput{
		Email:           "alice@example.com",
		Username:        "alice",
		FirstName:       "Alice",
		Password:        "secret123",
		PasswordConfirm: "secret123",
	}
	user, err := svc.Register(input, "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Email != "alice@example.com" {
		t.Errorf("expected alice@example.com, got %s", user.Email)
	}
}

func TestRegister_PasswordMismatch(t *testing.T) {
	mock := &testutil.MockUserRepo{}
	svc := service.NewUserService(mock, newTestKey(t))
	_, err := svc.Register(service.RegisterInput{
		Email: "a@a.com", Username: "aaa",
		Password: "pass1234", PasswordConfirm: "other1234",
	}, "127.0.0.1")
	if err == nil {
		t.Fatal("expected error for mismatched passwords")
	}
	if err.Error() != "passwords do not match" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestRegister_EmailAlreadyExists(t *testing.T) {
	mock := &testutil.MockUserRepo{EmailExistsVal: true}
	svc := service.NewUserService(mock, newTestKey(t))
	_, err := svc.Register(service.RegisterInput{
		Email: "taken@example.com", Username: "newuser",
		Password: "pass1234", PasswordConfirm: "pass1234",
	}, "127.0.0.1")
	if err == nil {
		t.Fatal("expected error for duplicate email")
	}
	if err.Error() != "email already registered" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestRegister_UsernameAlreadyExists(t *testing.T) {
	mock := &testutil.MockUserRepo{UsernameExistsVal: true}
	svc := service.NewUserService(mock, newTestKey(t))
	_, err := svc.Register(service.RegisterInput{
		Email: "free@example.com", Username: "taken",
		Password: "pass1234", PasswordConfirm: "pass1234",
	}, "127.0.0.1")
	if err == nil {
		t.Fatal("expected error for duplicate username")
	}
	if err.Error() != "username already taken" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestLogin_HappyPath(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("secret123"), bcrypt.MinCost)
	user := &models.User{ID: 1, Email: "bob@example.com", IsActive: true, Password: string(hashed)}
	mock := &testutil.MockUserRepo{ReturnUser: user}
	svc := service.NewUserService(mock, newTestKey(t))
	_, tokens, err := svc.Login(service.LoginInput{Email: "bob@example.com", Password: "secret123"}, "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if tokens.Access == "" {
		t.Error("expected non-empty access token")
	}
	if tokens.Refresh == "" {
		t.Error("expected non-empty refresh token")
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("correct"), bcrypt.MinCost)
	user := &models.User{ID: 1, Email: "bob@example.com", IsActive: true, Password: string(hashed)}
	mock := &testutil.MockUserRepo{ReturnUser: user}
	svc := service.NewUserService(mock, newTestKey(t))
	_, _, err := svc.Login(service.LoginInput{Email: "bob@example.com", Password: "wrong"}, "127.0.0.1")
	if err == nil {
		t.Fatal("expected error for wrong password")
	}
}

func TestLogin_UserNotFound(t *testing.T) {
	mock := &testutil.MockUserRepo{ReturnError: errors.New("record not found")}
	svc := service.NewUserService(mock, newTestKey(t))
	_, _, err := svc.Login(service.LoginInput{Email: "nope@test.com", Password: "pass"}, "127.0.0.1")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "invalid credentials" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestLogin_InactiveUser(t *testing.T) {
	hashed, _ := bcrypt.GenerateFromPassword([]byte("pass"), bcrypt.MinCost)
	user := &models.User{ID: 2, Email: "inactive@test.com", IsActive: false, Password: string(hashed)}
	mock := &testutil.MockUserRepo{ReturnUser: user}
	svc := service.NewUserService(mock, newTestKey(t))
	_, _, err := svc.Login(service.LoginInput{Email: "inactive@test.com", Password: "pass"}, "")
	if err == nil {
		t.Fatal("expected error for inactive user")
	}
	if err.Error() != "account is disabled" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}

func TestGetByID_HappyPath(t *testing.T) {
	user := &models.User{ID: 5, Email: "user@test.com"}
	mock := &testutil.MockUserRepo{ReturnUser: user}
	svc := service.NewUserService(mock, newTestKey(t))
	got, err := svc.GetByID(5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != 5 {
		t.Errorf("expected id=5, got %d", got.ID)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	mock := &testutil.MockUserRepo{ReturnError: errors.New("record not found")}
	svc := service.NewUserService(mock, newTestKey(t))
	_, err := svc.GetByID(999)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestUpdateUser_HappyPath(t *testing.T) {
	user := &models.User{ID: 3, FirstName: "Old", LastName: "Name"}
	mock := &testutil.MockUserRepo{ReturnUser: user}
	svc := service.NewUserService(mock, newTestKey(t))
	updated, err := svc.UpdateUser(3, "New", "Surname", "127.0.0.1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.FirstName != "New" {
		t.Errorf("expected FirstName=New, got %s", updated.FirstName)
	}
}

func TestUpdateUser_NotFound(t *testing.T) {
	mock := &testutil.MockUserRepo{ReturnError: errors.New("record not found")}
	svc := service.NewUserService(mock, newTestKey(t))
	_, err := svc.UpdateUser(99, "X", "Y", "")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "user not found" {
		t.Errorf("unexpected error: %s", err.Error())
	}
}
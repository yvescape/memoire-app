package service

import (
	"crypto/rsa"
	"errors"
	"os"
	"time"
	"users-service/internal/models"
	"users-service/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo       repository.UserRepo
	privateKey *rsa.PrivateKey
}

func NewUserService(repo repository.UserRepo, privateKey *rsa.PrivateKey) *UserService {
	return &UserService{repo: repo, privateKey: privateKey}
}

type RegisterInput struct {
	Email           string `json:"email" binding:"required,email"`
	Username        string `json:"username" binding:"required,min=3,max=50"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	Password        string `json:"password" binding:"required,min=8"`
	PasswordConfirm string `json:"password_confirm" binding:"required"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type TokenPair struct {
	Access  string `json:"access"`
	Refresh string `json:"refresh"`
}

func (s *UserService) Register(input RegisterInput, ip string) (*models.User, error) {
	if input.Password != input.PasswordConfirm {
		return nil, errors.New("passwords do not match")
	}
	if s.repo.EmailExists(input.Email) {
		return nil, errors.New("email already registered")
	}
	if s.repo.UsernameExists(input.Username) {
		return nil, errors.New("username already taken")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:     input.Email,
		Username:  input.Username,
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Password:  string(hashed),
	}
	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	_ = s.repo.CreateAuditLog(&models.UserAuditLog{
		UserID:    user.ID,
		Action:    "CREATE",
		IPAddress: ip,
	})

	return user, nil
}

func (s *UserService) Login(input LoginInput, ip string) (*models.User, *TokenPair, error) {
	user, err := s.repo.FindByEmail(input.Email)
	if err != nil {
		return nil, nil, errors.New("invalid credentials")
	}
	if !user.IsActive {
		return nil, nil, errors.New("account is disabled")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, nil, errors.New("invalid credentials")
	}

	tokens, err := s.generateTokens(user)
	if err != nil {
		return nil, nil, err
	}

	_ = s.repo.CreateAuditLog(&models.UserAuditLog{
		UserID:    user.ID,
		Action:    "LOGIN",
		IPAddress: ip,
	})

	return user, tokens, nil
}

func (s *UserService) UpdateUser(id uint, firstName, lastName, ip string) (*models.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	user.FirstName = firstName
	user.LastName = lastName
	if err := s.repo.Update(user); err != nil {
		return nil, err
	}
	_ = s.repo.CreateAuditLog(&models.UserAuditLog{
		UserID:    user.ID,
		Action:    "UPDATE",
		IPAddress: ip,
	})
	return user, nil
}

func (s *UserService) GetByID(id uint) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *UserService) ListUsers() ([]models.User, error) {
	return s.repo.FindAll()
}

func (s *UserService) ToggleActive(id uint) error {
	return s.repo.ToggleActive(id)
}

func (s *UserService) GetAuditLogs() ([]models.UserAuditLog, error) {
	return s.repo.FindAuditLogs()
}

func (s *UserService) RefreshToken(refreshToken string) (*TokenPair, error) {
	pubKey := &s.privateKey.PublicKey
	token, err := jwt.Parse(refreshToken, func(t *jwt.Token) (interface{}, error) {
		return pubKey, nil
	}, jwt.WithValidMethods([]string{"RS256"}))
	if err != nil || !token.Valid {
		return nil, errors.New("invalid refresh token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("invalid user_id in token")
	}
	user, err := s.repo.FindByID(uint(userIDFloat))
	if err != nil {
		return nil, errors.New("user not found")
	}
	return s.generateTokens(user)
}

func (s *UserService) generateTokens(user *models.User) (*TokenPair, error) {
	now := time.Now()

	accessClaims := jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"is_staff": user.IsStaff,
		"exp":      now.Add(15 * time.Minute).Unix(),
		"iat":      now.Unix(),
		"type":     "access",
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodRS256, accessClaims)
	accessSigned, err := accessToken.SignedString(s.privateKey)
	if err != nil {
		return nil, err
	}

	refreshClaims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     now.Add(7 * 24 * time.Hour).Unix(),
		"iat":     now.Unix(),
		"type":    "refresh",
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodRS256, refreshClaims)
	refreshSigned, err := refreshToken.SignedString(s.privateKey)
	if err != nil {
		return nil, err
	}

	return &TokenPair{Access: accessSigned, Refresh: refreshSigned}, nil
}

func loadPrivateKey() (*rsa.PrivateKey, error) {
	keyData := os.Getenv("JWT_PRIVATE_KEY")
	return jwt.ParseRSAPrivateKeyFromPEM([]byte(keyData))
}

func LoadPrivateKey() (*rsa.PrivateKey, error) {
	return loadPrivateKey()
}

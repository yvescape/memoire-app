package service

import (
	"errors"
	"fmt"
	"products-service/internal/models"
	"products-service/internal/repository"
)

type ProductService struct {
	repo repository.ProductRepo
}

func NewProductService(repo repository.ProductRepo) *ProductService {
	return &ProductService{repo: repo}
}

type ProductInput struct {
	Name        string  `json:"name" binding:"required"`
	Category    string  `json:"category" binding:"required"`
	Family      string  `json:"family" binding:"required"`
	Gender      string  `json:"gender" binding:"required"`
	Price       float64 `json:"price" binding:"required"`
	Size        string  `json:"size"`
	Image       string  `json:"image"`
	Badge       string  `json:"badge"`
	NotesTop    string  `json:"notes_top"`
	NotesHeart  string  `json:"notes_heart"`
	NotesBase   string  `json:"notes_base"`
	Composition string  `json:"composition"`
	Advice      string  `json:"advice"`
}

func (s *ProductService) List(page, pageSize int, search string) ([]models.ProductCard, int64, error) {
	products, total, err := s.repo.FindAll(page, pageSize, search)
	if err != nil {
		return nil, 0, err
	}
	cards := make([]models.ProductCard, len(products))
	for i, p := range products {
		cards[i] = toCard(p)
	}
	return cards, total, nil
}

func (s *ProductService) GetByID(id uint) (*models.Product, error) {
	return s.repo.FindByID(id)
}

func (s *ProductService) Create(input ProductInput) (*models.Product, error) {
	p := &models.Product{
		Name:        input.Name,
		Category:    input.Category,
		Family:      input.Family,
		Gender:      input.Gender,
		Price:       input.Price,
		Size:        input.Size,
		Image:       input.Image,
		Badge:       input.Badge,
		NotesTop:    input.NotesTop,
		NotesHeart:  input.NotesHeart,
		NotesBase:   input.NotesBase,
		Composition: input.Composition,
		Advice:      input.Advice,
	}
	if err := s.repo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) Update(id uint, input ProductInput) (*models.Product, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("product not found")
	}
	p.Name = input.Name
	p.Category = input.Category
	p.Family = input.Family
	p.Gender = input.Gender
	p.Price = input.Price
	p.Size = input.Size
	p.Image = input.Image
	p.Badge = input.Badge
	p.NotesTop = input.NotesTop
	p.NotesHeart = input.NotesHeart
	p.NotesBase = input.NotesBase
	p.Composition = input.Composition
	p.Advice = input.Advice
	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProductService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("product not found")
	}
	return s.repo.Delete(id)
}

func toCard(p models.Product) models.ProductCard {
	notes := fmt.Sprintf("%s · %s · %s", p.NotesTop, p.NotesHeart, p.NotesBase)
	return models.ProductCard{
		ID:       p.ID,
		Name:     p.Name,
		Category: p.Category,
		Family:   p.Family,
		Gender:   p.Gender,
		Price:    p.Price,
		Size:     p.Size,
		Image:    p.Image,
		Badge:    p.Badge,
		Notes:    notes,
	}
}
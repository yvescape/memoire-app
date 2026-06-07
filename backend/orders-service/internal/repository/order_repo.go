package repository

import (
	"orders-service/internal/models"

	"gorm.io/gorm"
)

type OrderRepo interface {
	FindByUserID(userID uint) ([]models.Order, error)
	FindBySessionID(sessionID string) ([]models.Order, error)
	FindByID(id uint) (*models.Order, error)
	Create(order *models.Order) error
	Save(order *models.Order) error
	UpdateStatus(id uint, status models.OrderStatus) error
	ClaimGuestOrders(sessionID string, userID uint) error
	FindCartOrder(userID *uint, sessionID *string) (*models.Order, error)
	FindItemByID(itemID uint) (*models.OrderItem, error)
	FindItemByProductAndOrder(productID, orderID uint) (*models.OrderItem, error)
	SaveItem(item *models.OrderItem) error
	DeleteItem(itemID uint) error
	CountCartItems(userID *uint, sessionID *string) (int64, error)
	SaveAddress(addr *models.OrderAddress) error
	FindAddressByID(id uint) (*models.OrderAddress, error)
	DeleteAddress(id uint) error
	FindActiveDeliveryOptions() ([]models.DeliveryOption, error)
	FindDefaultDelivery() (*models.DeliveryOption, error)
	FindDeliveryByID(id uint) (*models.DeliveryOption, error)
	CreateDeliveryOption(opt *models.DeliveryOption) error
	UpdateDeliveryOption(opt *models.DeliveryOption) error
	DeleteDeliveryOption(id uint) error
	FindAllDeliveryOptions() ([]models.DeliveryOption, error)
	SavePricing(pricing *models.OrderPricing) error
	RecalcPricing(orderID uint) error
}

type OrderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) preload(q *gorm.DB) *gorm.DB {
	return q.Preload("Items").
		Preload("Address").
		Preload("Pricing").
		Preload("Pricing.DeliveryOption")
}

func (r *OrderRepository) FindByUserID(userID uint) ([]models.Order, error) {
	var orders []models.Order
	err := r.preload(r.db).Where("user_id = ?", userID).Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) FindBySessionID(sessionID string) ([]models.Order, error) {
	var orders []models.Order
	err := r.preload(r.db).Where("session_id = ?", sessionID).Find(&orders).Error
	return orders, err
}

func (r *OrderRepository) FindByID(id uint) (*models.Order, error) {
	var order models.Order
	err := r.preload(r.db).First(&order, id).Error
	return &order, err
}

func (r *OrderRepository) Create(order *models.Order) error {
	return r.db.Create(order).Error
}

func (r *OrderRepository) Save(order *models.Order) error {
	return r.db.Save(order).Error
}

func (r *OrderRepository) UpdateStatus(id uint, status models.OrderStatus) error {
	return r.db.Model(&models.Order{}).Where("id = ?", id).Update("status", status).Error
}

func (r *OrderRepository) ClaimGuestOrders(sessionID string, userID uint) error {
	return r.db.Model(&models.Order{}).
		Where("session_id = ? AND user_id IS NULL", sessionID).
		Updates(map[string]interface{}{"user_id": userID, "session_id": nil}).Error
}

// OrderItem

func (r *OrderRepository) FindCartOrder(userID *uint, sessionID *string) (*models.Order, error) {
	var order models.Order
	q := r.preload(r.db).Where("status = ?", models.StatusPending)
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	} else if sessionID != nil {
		q = q.Where("session_id = ?", *sessionID)
	} else {
		return nil, gorm.ErrRecordNotFound
	}
	err := q.First(&order).Error
	return &order, err
}

func (r *OrderRepository) FindItemByID(itemID uint) (*models.OrderItem, error) {
	var item models.OrderItem
	err := r.db.First(&item, itemID).Error
	return &item, err
}

func (r *OrderRepository) FindItemByProductAndOrder(productID, orderID uint) (*models.OrderItem, error) {
	var item models.OrderItem
	err := r.db.Where("product_id = ? AND order_id = ?", productID, orderID).First(&item).Error
	return &item, err
}

func (r *OrderRepository) SaveItem(item *models.OrderItem) error {
	return r.db.Save(item).Error
}

func (r *OrderRepository) DeleteItem(itemID uint) error {
	return r.db.Delete(&models.OrderItem{}, itemID).Error
}

func (r *OrderRepository) CountCartItems(userID *uint, sessionID *string) (int64, error) {
	q := r.db.Model(&models.OrderItem{}).
		Joins("JOIN orders ON orders.id = order_items.order_id").
		Where("orders.status = ?", models.StatusPending)
	if userID != nil {
		q = q.Where("orders.user_id = ?", *userID)
	} else if sessionID != nil {
		q = q.Where("orders.session_id = ?", *sessionID)
	} else {
		return 0, nil
	}
	var total int64
	err := q.Select("COALESCE(SUM(order_items.quantity), 0)").Scan(&total).Error
	return total, err
}

// OrderAddress

func (r *OrderRepository) SaveAddress(addr *models.OrderAddress) error {
	return r.db.Save(addr).Error
}

func (r *OrderRepository) FindAddressByID(id uint) (*models.OrderAddress, error) {
	var addr models.OrderAddress
	err := r.db.First(&addr, id).Error
	return &addr, err
}

func (r *OrderRepository) DeleteAddress(id uint) error {
	return r.db.Delete(&models.OrderAddress{}, id).Error
}

// DeliveryOption

func (r *OrderRepository) FindActiveDeliveryOptions() ([]models.DeliveryOption, error) {
	var opts []models.DeliveryOption
	err := r.db.Where("is_active = ?", true).Order("position asc").Find(&opts).Error
	return opts, err
}

func (r *OrderRepository) FindDefaultDelivery() (*models.DeliveryOption, error) {
	var opt models.DeliveryOption
	err := r.db.Where("is_default = ? AND is_active = ?", true, true).First(&opt).Error
	return &opt, err
}

func (r *OrderRepository) FindDeliveryByID(id uint) (*models.DeliveryOption, error) {
	var opt models.DeliveryOption
	err := r.db.First(&opt, id).Error
	return &opt, err
}

func (r *OrderRepository) CreateDeliveryOption(opt *models.DeliveryOption) error {
	if opt.IsDefault {
		r.db.Model(&models.DeliveryOption{}).Where("is_default = ?", true).
			UpdateColumn("is_default", false)
	}
	return r.db.Create(opt).Error
}

func (r *OrderRepository) UpdateDeliveryOption(opt *models.DeliveryOption) error {
	if opt.IsDefault {
		r.db.Model(&models.DeliveryOption{}).Where("is_default = ? AND id != ?", true, opt.ID).
			UpdateColumn("is_default", false)
	}
	return r.db.Save(opt).Error
}

func (r *OrderRepository) DeleteDeliveryOption(id uint) error {
	return r.db.Delete(&models.DeliveryOption{}, id).Error
}

func (r *OrderRepository) FindAllDeliveryOptions() ([]models.DeliveryOption, error) {
	var opts []models.DeliveryOption
	err := r.db.Order("position asc").Find(&opts).Error
	return opts, err
}

// OrderPricing

func (r *OrderRepository) SavePricing(pricing *models.OrderPricing) error {
	return r.db.Omit("DeliveryOption").Save(pricing).Error
}

func (r *OrderRepository) RecalcPricing(orderID uint) error {
	var items []models.OrderItem
	if err := r.db.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return err
	}

	var subtotal float64
	for _, item := range items {
		subtotal += item.Price * float64(item.Quantity)
	}

	var pricing models.OrderPricing
	err := r.db.Where("order_id = ?", orderID).First(&pricing).Error
	if err != nil {
		pricing = models.OrderPricing{OrderID: orderID, Currency: "FCFA"}
		if defaultOpt, defaultErr := r.FindDefaultDelivery(); defaultErr == nil {
			pricing.DeliveryOptionID = &defaultOpt.ID
			pricing.DeliveryPrice = defaultOpt.Amount
		}
		pricing.Subtotal = subtotal
		pricing.Total = subtotal + pricing.DeliveryPrice
		if pricing.DeliveryOptionID != nil {
			return r.db.Exec(
				`INSERT INTO order_pricings (order_id, delivery_option_id, subtotal, delivery_price, total, currency, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
				orderID, *pricing.DeliveryOptionID, pricing.Subtotal, pricing.DeliveryPrice, pricing.Total, pricing.Currency,
			).Error
		}
		return r.db.Exec(
			`INSERT INTO order_pricings (order_id, subtotal, delivery_price, total, currency, updated_at) VALUES (?, ?, ?, ?, ?, NOW())`,
			orderID, pricing.Subtotal, pricing.DeliveryPrice, pricing.Total, pricing.Currency,
		).Error
	}

	pricing.Subtotal = subtotal
	pricing.Total = subtotal + pricing.DeliveryPrice
	return r.db.Where("id = ?", pricing.ID).Save(&pricing).Error
}

package main

import (
	"log"
	"os"
	"products-service/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=user_admin password=pass123 dbname=products_db port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.Product{}); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	var count int64
	db.Model(&models.Product{}).Count(&count)
	if count > 0 {
		log.Printf("seed skipped: %d products already exist", count)
		return
	}

	products := []models.Product{
		{
			Name:        "Lumière Dorée",
			Category:    "Eau de Parfum",
			Price:       121000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1541643600914-78b084683601?w=700&q=80",
			Badge:       "Bestseller",
			Family:      "Floral",
			Gender:      "Femme",
			NotesTop:    "Bergamote, Mandarine",
			NotesHeart:  "Jasmin, Rose, Pivoine",
			NotesBase:   "Musc blanc, Vanille, Bois de santal",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Linalool, Geraniol",
			Advice:      "Vaporiser sur les points de pulsation : poignets, cou, derrière les oreilles. Éviter le contact avec les yeux.",
		},
		{
			Name:        "Nuit Profonde",
			Category:    "Eau de Parfum",
			Price:       144000,
			Size:        "75ml",
			Image:       "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&q=80",
			Badge:       "Nouveau",
			Family:      "Oriental",
			Gender:      "Unisexe",
			NotesTop:    "Safran, Cardamome",
			NotesHeart:  "Rose, Géranium",
			NotesBase:   "Oud, Ambre, Patchouli",
			Composition: "Alcohol, Parfum, Aqua, Benzyl salicylate, Citronellol, Eugenol",
			Advice:      "Application légère sur les poignets et le cou. Parfait pour les soirées.",
		},
		{
			Name:        "Aurore Blanche",
			Category:    "Eau de Toilette",
			Price:       95000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&q=80",
			Badge:       "",
			Family:      "Floral",
			Gender:      "Femme",
			NotesTop:    "Néroli, Bergamote",
			NotesHeart:  "Pivoine, Rose, Jasmin",
			NotesBase:   "Cèdre, Musc, Ambre",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Linalool, Citral",
			Advice:      "Idéal pour un usage quotidien. Vaporiser sur les vêtements ou la peau.",
		},
		{
			Name:        "Forêt d'Été",
			Category:    "Eau de Parfum",
			Price:       108000,
			Size:        "50ml",
			Image:       "https://images.unsplash.com/photo-1624811742200-69166e7b7bcc?w=600&q=80",
			Badge:       "",
			Family:      "Boisé",
			Gender:      "Homme",
			NotesTop:    "Pamplemousse, Pin",
			NotesHeart:  "Poivre, Genièvre",
			NotesBase:   "Vétiver, Mousse, Cèdre",
			Composition: "Alcohol, Parfum, Aqua, Limonene, Coumarin, Linalool",
			Advice:      "Parfait pour la journée. Application sur les poignets et le cou.",
		},
		{
			Name:        "Rose Absolue",
			Category:    "Extrait de Parfum",
			Price:       190000,
			Size:        "30ml",
			Image:       "https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=600&q=80",
			Badge:       "Exclusif",
			Family:      "Floral",
			Gender:      "Femme",
			NotesTop:    "Framboise, Poivre rose",
			NotesHeart:  "Rose de Mai, Jasmin, Violette",
			NotesBase:   "Oud, Patchouli, Musc",
			Composition: "Alcohol, Parfum, Aqua, Geraniol, Citronellol, Eugenol",
			Advice:      "Application légère pour une tenue longue durée. Éviter les frottements.",
		},
		{
			Name:        "Eau Fraîche",
			Category:    "Eau de Toilette",
			Price:       72000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=600&q=80",
			Badge:       "",
			Family:      "Aromatique",
			Gender:      "Homme",
			NotesTop:    "Citron, Bergamote, Menthe",
			NotesHeart:  "Aqua, Notes marines",
			NotesBase:   "Vétiver, Musc blanc",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Linalool",
			Advice:      "Très frais, idéal pour l'été. Vaporiser généreusement.",
		},
		{
			Name:        "Ambre Doré",
			Category:    "Eau de Parfum",
			Price:       128000,
			Size:        "75ml",
			Image:       "https://images.unsplash.com/photo-1708979165880-dd0ff61fa748?w=600&q=80",
			Badge:       "",
			Family:      "Oriental",
			Gender:      "Unisexe",
			NotesTop:    "Bergamote, Mandarine",
			NotesHeart:  "Ambre, Vanille",
			NotesBase:   "Santal, Musc, Fève tonka",
			Composition: "Alcohol, Parfum, Aqua, Benzyl benzoate, Coumarin, Vanillin",
			Advice:      "Chaleureux et enveloppant. Idéal pour les soirées d'hiver.",
		},
		{
			Name:        "Iris Sauvage",
			Category:    "Extrait de Parfum",
			Price:       171000,
			Size:        "50ml",
			Image:       "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&q=80",
			Badge:       "Nouveau",
			Family:      "Floral",
			Gender:      "Femme",
			NotesTop:    "Bergamote, Poivre rose",
			NotesHeart:  "Iris, Violette, Rose",
			NotesBase:   "Vétiver, Musc, Cèdre",
			Composition: "Alcohol, Parfum, Aqua, Alpha-isomethyl ionone, Linalool",
			Advice:      "Élégant et raffiné. Parfait pour les occasions spéciales.",
		},
		{
			Name:        "Bois d'Encens",
			Category:    "Eau de Parfum",
			Price:       138000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&q=80",
			Badge:       "",
			Family:      "Boisé",
			Gender:      "Homme",
			NotesTop:    "Poivre, Safran",
			NotesHeart:  "Encens, Myrrhe",
			NotesBase:   "Cèdre, Patchouli, Cuir",
			Composition: "Alcohol, Parfum, Aqua, Limonene, Eugenol, Benzyl alcohol",
			Advice:      "Puissant et mystérieux. Application modérée sur les points de pulsation.",
		},
		{
			Name:        "Fleur d'Oranger",
			Category:    "Eau de Toilette",
			Price:       85000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=600&q=80",
			Badge:       "",
			Family:      "Floral",
			Gender:      "Femme",
			NotesTop:    "Néroli, Bergamote",
			NotesHeart:  "Fleur d'oranger, Jasmin",
			NotesBase:   "Musc, Amande, Vanille",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Linalool, Citral",
			Advice:      "Fraîche et lumineuse. Idéale pour le printemps et l'été.",
		},
		{
			Name:        "Cuir Intense",
			Category:    "Extrait de Parfum",
			Price:       184000,
			Size:        "50ml",
			Image:       "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=600&q=80",
			Badge:       "Nouveau",
			Family:      "Boisé",
			Gender:      "Homme",
			NotesTop:    "Bergamote, Rhum",
			NotesHeart:  "Cuir, Tabac",
			NotesBase:   "Whisky, Vanille, Cèdre",
			Composition: "Alcohol, Parfum, Aqua, Benzyl alcohol, Limonene, Coumarin",
			Advice:      "Intense et sophistiqué. Parfait pour les grandes occasions.",
		},
		{
			Name:        "Vanille Bourbon",
			Category:    "Eau de Parfum",
			Price:       115000,
			Size:        "75ml",
			Image:       "https://images.unsplash.com/photo-1674318881563-84ba1a53d9c4?w=600&q=80",
			Badge:       "",
			Family:      "Oriental",
			Gender:      "Unisexe",
			NotesTop:    "Bergamote, Orange",
			NotesHeart:  "Vanille, Fève tonka",
			NotesBase:   "Amande, Santal, Musc",
			Composition: "Alcohol, Parfum, Aqua, Vanillin, Coumarin, Benzyl benzoate",
			Advice:      "Gourmand et réconfortant. Application sur les poignets et le cou.",
		},
		{
			Name:        "Agrumes de Sicile",
			Category:    "Eau de Toilette",
			Price:       62000,
			Size:        "100ml",
			Image:       "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
			Badge:       "",
			Family:      "Aromatique",
			Gender:      "Femme",
			NotesTop:    "Citron, Orange, Bergamote",
			NotesHeart:  "Pétitgrain, Menthe",
			NotesBase:   "Vétiver, Musc blanc",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Citral, Linalool",
			Advice:      "Énergisant et frais. Idéal pour un usage quotidien.",
		},
		{
			Name:        "Oud Royal",
			Category:    "Extrait de Parfum",
			Price:       210000,
			Size:        "50ml",
			Image:       "https://images.unsplash.com/photo-1611242956059-53e4c29e6b22?w=600&q=80",
			Badge:       "Exclusif",
			Family:      "Oriental",
			Gender:      "Homme",
			NotesTop:    "Safran, Baies roses",
			NotesHeart:  "Rose, Géranium",
			NotesBase:   "Oud, Ambre, Patchouli",
			Composition: "Alcohol, Parfum, Aqua, Benzyl salicylate, Eugenol, Citronellol",
			Advice:      "Prestigieux et unique. Une seule pulvérisation suffit.",
		},
		{
			Name:        "Thé Vert",
			Category:    "Eau de Toilette",
			Price:       56000,
			Size:        "150ml",
			Image:       "https://images.unsplash.com/photo-1709660628819-c8f1cb5d818b?w=600&q=80",
			Badge:       "",
			Family:      "Aromatique",
			Gender:      "Unisexe",
			NotesTop:    "Thé vert, Citron, Menthe",
			NotesHeart:  "Jasmin, Bergamote",
			NotesBase:   "Musc, Cèdre",
			Composition: "Alcohol denat., Parfum, Aqua, Limonene, Linalool, Citral",
			Advice:      "Apaisant et rafraîchissant. Parfait pour toute la famille.",
		},
	}

	result := db.Create(&products)
	if result.Error != nil {
		log.Fatalf("seed failed: %v", result.Error)
	}

	log.Printf("seed completed: %d products inserted", result.RowsAffected)
}

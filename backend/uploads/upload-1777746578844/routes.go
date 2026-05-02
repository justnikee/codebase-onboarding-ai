package routes

import (
	"net/http"

	"vyoma-api/internal/handlers"
	"vyoma-api/internal/repositories"
	"vyoma-api/internal/services"

	"github.com/go-chi/chi/v5"
)

func RegisterRoutes(r chi.Router) {
	// repositories
	businessRepo := &repositories.BusinessRepository{}
	ruleRepo := &repositories.ComplianceRuleRepository{}
	complianceRepo := &repositories.BusinessComplianceRepository{}

	// services
	businessService := services.NewBusinessService(
		businessRepo,
		ruleRepo,
		complianceRepo,
	)

	complianceService := services.NewBusinessComplianceService(complianceRepo)

	// handlers
	businessHandler := handlers.NewBusinessHandler(businessService)
	complianceHandler := handlers.NewBusinessComplianceHandler(complianceService)

	// routes
	r.Route("/businesses", func(r chi.Router) {
		r.Post("/", businessHandler.CreateBusiness)
		r.Get("/{id}", businessHandler.GetBusinessByID)
		r.Get("/{id}/compliances", complianceHandler.ListByBusinessID)
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})

	r.Get("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello from Go backend 👋"))
	})
}

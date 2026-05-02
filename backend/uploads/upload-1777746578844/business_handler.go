package handlers

import (
	"encoding/json"
	"net/http"
	"vyoma-api/internal/models"
	"vyoma-api/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type BusinessHandler struct {
	service *services.BusinessService
}

func NewBusinessHandler(service *services.BusinessService) *BusinessHandler {
	return &BusinessHandler{service: service}
}

func (h *BusinessHandler) CreateBusiness(w http.ResponseWriter, r *http.Request) {
	var business models.Business
	if err := json.NewDecoder(r.Body).Decode(&business); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	create, err := h.service.CreateBusiness(r.Context(), &business)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(create)
}

func (h *BusinessHandler) GetBusinessByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")

	id, err := uuid.Parse(idParam)
	if err != nil {
		http.Error(w, "invalid business id", http.StatusBadRequest)
		return
	}

	business, err := h.service.GetBusinessByID(r.Context(), id)
	if err != nil {
		http.Error(w, "business not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(business)
}

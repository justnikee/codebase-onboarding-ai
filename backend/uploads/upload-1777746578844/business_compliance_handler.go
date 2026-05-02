package handlers

import (
	"encoding/json"
	"net/http"

	"vyoma-api/internal/services"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type BusinessComplianceHandler struct {
	service *services.BusinessComplianceService
}

func NewBusinessComplianceHandler(
	service *services.BusinessComplianceService,
) *BusinessComplianceHandler {
	return &BusinessComplianceHandler{service: service}
}

func (h *BusinessComplianceHandler) ListByBusinessID(
	w http.ResponseWriter,
	r *http.Request,
) {
	idParam := chi.URLParam(r, "id")

	businessID, err := uuid.Parse(idParam)
	if err != nil {
		http.Error(w, "invalid business id", http.StatusBadRequest)
		return
	}

	compliances, err := h.service.ListByBusinessID(
		r.Context(),
		businessID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(compliances)
}

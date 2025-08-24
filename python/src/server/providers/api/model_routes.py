"""
Model management API endpoints

This module provides endpoints for managing AI models within providers.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends

from ..services.provider_service import ProviderService
from ..models.schemas import ModelCreate, ModelUpdate, ModelResponse
from ..core.enums import ModelType
from .dependencies import get_provider_service

router = APIRouter()


@router.get("/models/", response_model=List[ModelResponse])
async def list_models(
    provider_id: Optional[UUID] = None,
    model_type: Optional[ModelType] = None,
    is_available: Optional[bool] = None,
    service: ProviderService = Depends(get_provider_service)
):
    """List all models with optional filters"""
    try:
        return await service.list_models(provider_id=provider_id, is_available=is_available, model_type=model_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.post("/{provider_id}/models", response_model=ModelResponse)
async def add_model(
    provider_id: UUID,
    model: ModelCreate,
    service: ProviderService = Depends(get_provider_service)
):
    """Add a model to a provider"""
    try:
        # Set the provider_id from the URL without mutating the incoming object
        model = model.model_copy(update={"provider_id": provider_id})
        return await service.add_model(model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add model: {str(e)}")
"""
Provider CRUD operations API endpoints

This module provides endpoints for creating, reading, updating, and deleting providers.
"""

from typing import List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from ..services.provider_service import ProviderService
from ..models.schemas import ProviderCreate, ProviderUpdate, ProviderResponse
from ..core.enums import ServiceType
from .dependencies import get_provider_service

router = APIRouter()


class ActiveProvidersResponse(BaseModel):
    """Response model for active providers"""
    llm_provider_id: Optional[str] = None
    embedding_provider_id: Optional[str] = None
    vision_provider_id: Optional[str] = None
    reranking_provider_id: Optional[str] = None
    speech_provider_id: Optional[str] = None


class SetActiveProviderRequest(BaseModel):
    """Request model for setting active provider"""
    service_type: ServiceType
    provider_id: str


@router.get("/active", response_model=ActiveProvidersResponse)
async def get_active_providers(
    service: ProviderService = Depends(get_provider_service)
):
    """Get active providers for all service types"""
    try:
        active = await service.get_active_providers()
        return ActiveProvidersResponse(**active)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active providers: {str(e)}")


@router.post("/active")
async def set_active_provider(
    request: SetActiveProviderRequest,
    service: ProviderService = Depends(get_provider_service)
):
    """Set active provider for a service type"""
    try:
        await service.set_active_provider(request.service_type, UUID(request.provider_id))
        return {"message": f"Active provider set for {request.service_type}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set active provider: {str(e)}")


@router.get("/", response_model=List[ProviderResponse])
async def list_providers(
    service_type: Optional[ServiceType] = None,
    is_active: Optional[bool] = None,
    service: ProviderService = Depends(get_provider_service)
):
    """List all providers with optional filters"""
    try:
        return await service.list_providers(is_active=is_active, service_type=service_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list providers: {str(e)}")


@router.post("/", response_model=ProviderResponse)
async def create_provider(
    provider: ProviderCreate,
    service: ProviderService = Depends(get_provider_service)
):
    """Create a new provider"""
    try:
        return await service.create_provider(provider)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create provider: {str(e)}")


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: UUID,
    service: ProviderService = Depends(get_provider_service)
):
    """Get a provider by ID"""
    try:
        provider = await service.get_provider(provider_id)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        return provider
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get provider: {str(e)}")


@router.patch("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: UUID,
    update: ProviderUpdate,
    service: ProviderService = Depends(get_provider_service)
):
    """Update a provider"""
    try:
        provider = await service.update_provider(provider_id, update)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        return provider
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update provider: {str(e)}")


@router.delete("/{provider_id}")
async def delete_provider(
    provider_id: UUID,
    service: ProviderService = Depends(get_provider_service)
):
    """Delete (deactivate) a provider"""
    try:
        success = await service.delete_provider(provider_id)
        if not success:
            raise HTTPException(status_code=404, detail="Provider not found")
        return {"message": "Provider deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete provider: {str(e)}")
"""
Usage tracking API endpoints

This module provides endpoints for tracking and reporting provider usage metrics.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends

from ..services.provider_service import ProviderService
from ..models.schemas import UsageResponse, UsageSummary
from .dependencies import get_provider_service

router = APIRouter()


@router.get("/usage/summary", response_model=UsageSummary)
async def get_usage_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    service: ProviderService = Depends(get_provider_service)
):
    """Get usage summary across all providers"""
    try:
        return await service.get_usage_summary(start_date=start_date, end_date=end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage summary: {str(e)}")


@router.get("/{provider_id}/usage", response_model=List[UsageResponse])
async def get_provider_usage(
    provider_id: UUID,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    service: ProviderService = Depends(get_provider_service)
):
    """Get usage metrics for a provider"""
    try:
        return await service.get_usage_metrics(provider_id, start_date, end_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get usage metrics: {str(e)}")
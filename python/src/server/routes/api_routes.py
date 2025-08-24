"""
Central API route definitions

This is the single source of truth for all API routes in the application.
These definitions are used by both the backend routers and are exported
to TypeScript for type-safe frontend usage.
"""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class RouteDefinition:
    """Represents a single route definition"""
    path: str
    params: list[str] = None
    
    def __post_init__(self):
        if self.params is None:
            self.params = []


class APIRoutes:
    """
    Central definition of all API routes.
    
    These routes are used by:
    1. Backend FastAPI routers
    2. Frontend TypeScript services (via generated types)
    3. Tests for route validation
    """
    
    # ==================== Provider Routes ====================
    class Providers:
        BASE = "/api/providers"
        
        # Provider CRUD
        LIST = "/"
        CREATE = "/"
        DETAIL = "/{provider_id}"
        UPDATE = "/{provider_id}"
        DELETE = "/{provider_id}"
        
        # Active Provider Management
        GET_ACTIVE = "/active"
        SET_ACTIVE = "/active"
        
        # Credentials
        ADD_CREDENTIAL = "/{provider_id}/credentials"
        ROTATE_CREDENTIAL = "/credentials/{credential_id}/rotate"
        
        # Models
        ADD_MODEL = "/{provider_id}/models"
        LIST_MODELS = "/models/"
        
        # Health & Monitoring
        HEALTH_CHECK = "/{provider_id}/health-check"
        HEALTH_HISTORY = "/{provider_id}/health-history"
        
        # Usage & Quotas
        GET_USAGE = "/{provider_id}/usage"
        USAGE_SUMMARY = "/usage/summary"
        CREATE_QUOTA = "/{provider_id}/quotas"
        LIST_QUOTAS = "/{provider_id}/quotas"
        
        # AI Operations
        EMBEDDINGS = "/embeddings"
        CHAT = "/chat"
        
        # Incidents
        CREATE_INCIDENT = "/{provider_id}/incidents"
        UPDATE_INCIDENT = "/incidents/{incident_id}"
        LIST_INCIDENTS = "/{provider_id}/incidents"
    
    # ==================== Project Routes ====================
    class Projects:
        BASE = "/api"
        
        LIST = "/projects"
        CREATE = "/projects"
        DETAIL = "/projects/{project_id}"
        UPDATE = "/projects/{project_id}"
        DELETE = "/projects/{project_id}"
        
        # Tasks
        LIST_TASKS = "/projects/{project_id}/tasks"
        CREATE_TASK = "/projects/{project_id}/tasks"
        UPDATE_TASK = "/projects/{project_id}/tasks/{task_id}"
        DELETE_TASK = "/projects/{project_id}/tasks/{task_id}"
        
        # Documents
        LIST_DOCUMENTS = "/projects/{project_id}/documents"
        CREATE_DOCUMENT = "/projects/{project_id}/documents"
        UPDATE_DOCUMENT = "/projects/{project_id}/documents/{document_id}"
        
        # Task operations
        TASKS_BY_STATUS = "/tasks"
        TASK_DETAIL = "/tasks/{task_id}"
        UPDATE_TASK_STATUS = "/tasks/{task_id}"
        DELETE_TASK_DIRECT = "/tasks/{task_id}"
        
        # Features
        PROJECT_FEATURES = "/project-features/{project_id}"
    
    # ==================== Knowledge Routes ====================
    class Knowledge:
        BASE = "/api"
        
        # Crawling
        CRAWL_SINGLE = "/crawl/single"
        CRAWL_SMART = "/crawl/smart"
        CRAWL_DEEP = "/crawl/deep"
        CRAWL_STATUS = "/crawl/status"
        
        # Knowledge Items
        LIST_ITEMS = "/knowledge/items"
        DELETE_ITEM = "/knowledge/items/{item_id}"
        
        # Upload
        UPLOAD_FILE = "/upload"
        
        # Search & RAG
        RAG_QUERY = "/rag"
        SEARCH = "/knowledge/search"
        
        # Sources
        GET_SOURCES = "/sources"
    
    # ==================== Settings Routes ====================
    class Settings:
        BASE = "/api"
        
        # Credentials
        LIST_CREDENTIALS = "/credentials"
        GET_CREDENTIAL = "/credentials/{key}"
        CREATE_CREDENTIAL = "/credentials"
        UPDATE_CREDENTIAL = "/credentials/{key}"
        DELETE_CREDENTIAL = "/credentials/{key}"
        GET_CATEGORY_CREDENTIALS = "/credentials/categories/{category}"
        INITIALIZE_CREDENTIALS = "/credentials/initialize"
        
        # Database
        DATABASE_METRICS = "/database/metrics"
        
        # Health
        SETTINGS_HEALTH = "/settings/health"
    
    # ==================== MCP Routes ====================
    class MCP:
        BASE = "/api/mcp"
        
        START = "/start"
        STOP = "/stop"
        STATUS = "/status"
        LOGS = "/logs"
        DELETE_LOGS = "/logs"
        CONFIG = "/config"
        UPDATE_CONFIG = "/config"
        TOOLS = "/tools"
        HEALTH = "/health"
    
    # ==================== Test Routes ====================
    class Tests:
        BASE = "/api/tests"
        
        RUN_MCP = "/mcp/run"
        RUN_UI = "/ui/run"
        STATUS = "/status/{execution_id}"
        HISTORY = "/history"
        DELETE_EXECUTION = "/execution/{execution_id}"
        LATEST_RESULTS = "/latest-results"
    
    # ==================== Agent Chat Routes ====================
    class AgentChat:
        BASE = "/api/agent-chat"
        
        STATUS = "/status"
        GET_SESSION = "/sessions/{session_id}"
        CREATE_SESSION = "/sessions"
        UPDATE_SESSION = "/sessions/{session_id}"
        LIST_SESSIONS = "/sessions"
    
    # ==================== Coverage Routes ====================
    class Coverage:
        BASE = "/api/coverage"
        
        DEBUG_PATHS = "/debug/paths"
        PYTEST_JSON = "/pytest/json"
        PYTEST_HTML = "/pytest/html/{path:path}"
    
    # ==================== Bug Report Routes ====================
    class BugReport:
        BASE = "/api/bug-report"
        
        SUBMIT_GITHUB = "/github"
    
    # ==================== Internal Routes ====================
    class Internal:
        BASE = "/internal"
        
        HEALTH = "/health"
        CREDENTIALS_AGENTS = "/credentials/agents"
        CREDENTIALS_MCP = "/credentials/mcp"
    
    # ==================== Health Routes ====================
    class Health:
        ROOT = "/"
        HEALTH = "/health"
        API_HEALTH = "/api/health"


# Export route metadata for TypeScript generation
def get_all_routes() -> Dict[str, Dict[str, Any]]:
    """
    Extract all routes with their metadata for TypeScript generation.
    
    Returns a dictionary structure that can be used to generate
    TypeScript route definitions.
    """
    routes = {}
    
    # Helper to extract params from route path
    def extract_params(path: str) -> list[str]:
        import re
        return re.findall(r'\{(\w+)\}', path)
    
    # Process each route class
    for class_name in dir(APIRoutes):
        if class_name.startswith('_'):
            continue
            
        route_class = getattr(APIRoutes, class_name)
        if not isinstance(route_class, type):
            continue
            
        class_routes = {}
        for attr_name in dir(route_class):
            if attr_name.startswith('_'):
                continue
                
            attr_value = getattr(route_class, attr_name)
            if isinstance(attr_value, str):
                if attr_name == 'BASE':
                    class_routes['_base'] = attr_value
                else:
                    class_routes[attr_name.lower()] = {
                        'path': attr_value,
                        'params': extract_params(attr_value)
                    }
        
        if class_routes:
            routes[class_name.lower()] = class_routes
    
    return routes
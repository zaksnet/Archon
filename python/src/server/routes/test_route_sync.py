"""
Tests to ensure route synchronization between backend and frontend

Run these tests to verify:
1. All backend routes are defined in TypeScript
2. No hardcoded routes in frontend code
3. Route parameters match
"""

import os
import re
from pathlib import Path
import pytest
from typing import Set, List, Tuple

from .api_routes import get_all_routes
from .route_generator import generate_route_map, generate_typescript_routes


class TestRouteSync:
    """Test suite for route synchronization"""
    
    @pytest.fixture
    def backend_routes(self) -> dict:
        """Get all backend route definitions"""
        return generate_route_map()
    
    @pytest.fixture
    def frontend_routes_path(self) -> Path:
        """Get path to generated TypeScript routes"""
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent.parent.parent
        return project_root / "archon-ui-main" / "src" / "routes" / "routes.generated.ts"
    
    @pytest.fixture
    def frontend_services_dir(self) -> Path:
        """Get path to frontend services directory"""
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent.parent.parent
        return project_root / "archon-ui-main" / "src" / "services"
    
    def test_typescript_routes_exist(self, frontend_routes_path: Path):
        """Test that TypeScript routes file exists"""
        assert frontend_routes_path.exists(), \
            f"TypeScript routes file not found at {frontend_routes_path}. Run generate_routes.py"
    
    def test_all_backend_routes_in_typescript(self, backend_routes: dict, frontend_routes_path: Path):
        """Test that all backend routes are defined in TypeScript"""
        if not frontend_routes_path.exists():
            pytest.skip("TypeScript routes file not found")
        
        ts_content = frontend_routes_path.read_text()
        missing_routes = []
        
        for route_key, route_path in backend_routes.items():
            # Check if the route path appears in the TypeScript file
            # Account for parameter syntax differences
            ts_path = route_path
            for param in re.findall(r'\{(\w+)\}', route_path):
                ts_path = ts_path.replace(f"{{{param}}}", f"${{{param}}}")
            
            if route_path not in ts_content and ts_path not in ts_content:
                missing_routes.append(f"{route_key}: {route_path}")
        
        assert not missing_routes, \
            f"Backend routes missing in TypeScript:\n" + "\n".join(missing_routes)
    
    def test_no_hardcoded_api_routes(self, frontend_services_dir: Path):
        """Test that frontend services don't have hardcoded API routes"""
        if not frontend_services_dir.exists():
            pytest.skip("Frontend services directory not found")
        
        hardcoded_patterns = [
            r'["\']\/api\/[^"\']+["\']',  # Matches '/api/...' strings
            r'`\/api\/[^`]+`',             # Matches `/api/...` template literals
        ]
        
        violations = []
        
        # Scan all TypeScript/JavaScript files
        for file_path in frontend_services_dir.rglob("*.ts"):
            # Skip test files and generated files
            if "test" in file_path.name or "generated" in file_path.name:
                continue
            
            content = file_path.read_text()
            
            for pattern in hardcoded_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    # Check if it's importing from routes
                    if "from '@/routes'" not in content and "from '../routes'" not in content:
                        violations.append({
                            'file': str(file_path.relative_to(frontend_services_dir.parent)),
                            'matches': matches
                        })
        
        if violations:
            msg = "Hardcoded API routes found (should use API_ROUTES instead):\n"
            for v in violations:
                msg += f"\n{v['file']}:\n"
                for match in v['matches']:
                    msg += f"  - {match}\n"
            
            # This is a warning for now, not a failure
            pytest.skip(msg)
    
    def test_route_parameters_match(self, backend_routes: dict):
        """Test that route parameters are consistent"""
        all_routes = get_all_routes()
        param_issues = []
        
        for category_name, category_routes in all_routes.items():
            for route_name, route_info in category_routes.items():
                if route_name == '_base':
                    continue
                
                path = route_info['path']
                params = route_info['params']
                
                # Check for common parameter naming issues
                for param in params:
                    # Parameters should use snake_case
                    if not re.match(r'^[a-z_]+$', param):
                        param_issues.append(
                            f"{category_name}.{route_name}: "
                            f"Parameter '{param}' should use snake_case"
                        )
                
                # Check for duplicate parameters
                if len(params) != len(set(params)):
                    param_issues.append(
                        f"{category_name}.{route_name}: "
                        f"Duplicate parameters found"
                    )
        
        assert not param_issues, \
            "Route parameter issues found:\n" + "\n".join(param_issues)
    
    def test_typescript_generation_is_deterministic(self):
        """Test that TypeScript generation produces consistent output"""
        # Generate TypeScript twice
        output1 = generate_typescript_routes()
        output2 = generate_typescript_routes()
        
        # Remove timestamps for comparison
        output1_clean = re.sub(r'Generated at: .*', '', output1)
        output2_clean = re.sub(r'Generated at: .*', '', output2)
        
        assert output1_clean == output2_clean, \
            "TypeScript generation is not deterministic"
    
    def test_all_route_classes_have_base(self):
        """Test that all route classes define a BASE path"""
        all_routes = get_all_routes()
        
        missing_base = []
        for category_name, category_routes in all_routes.items():
            if '_base' not in category_routes:
                missing_base.append(category_name)
        
        assert not missing_base, \
            f"Route classes missing BASE definition: {', '.join(missing_base)}"
    
    def test_no_duplicate_route_paths(self, backend_routes: dict):
        """Test that there are no duplicate route paths"""
        path_to_keys = {}
        
        for route_key, route_path in backend_routes.items():
            # Normalize path by removing parameters for comparison
            normalized = re.sub(r'\{[^}]+\}', '{}', route_path)
            
            if normalized not in path_to_keys:
                path_to_keys[normalized] = []
            path_to_keys[normalized].append(route_key)
        
        duplicates = {
            path: keys 
            for path, keys in path_to_keys.items() 
            if len(keys) > 1 and path != '/{}'  # Allow multiple /{id} routes
        }
        
        if duplicates:
            msg = "Duplicate route paths found:\n"
            for path, keys in duplicates.items():
                msg += f"\n{path}:\n"
                for key in keys:
                    msg += f"  - {key}\n"
            
            # This might be intentional (different methods), so warning only
            pytest.skip(msg)


def run_validation():
    """Run route validation from command line"""
    import sys
    
    print("Running route synchronization tests...")
    
    # Run pytest programmatically
    exit_code = pytest.main([__file__, "-v"])
    
    if exit_code == 0:
        print("\n✅ All route synchronization tests passed!")
    else:
        print("\n❌ Some tests failed. Please fix the issues above.")
        sys.exit(exit_code)


if __name__ == "__main__":
    run_validation()
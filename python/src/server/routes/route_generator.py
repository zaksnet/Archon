"""
TypeScript route generator

Generates type-safe TypeScript route definitions from Python API routes.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any
from .api_routes import get_all_routes


def generate_typescript_routes(output_dir: str = None) -> str:
    """
    Generate TypeScript route definitions from Python routes.
    
    Args:
        output_dir: Directory to write the generated file to.
                   If None, returns the content as a string.
    
    Returns:
        The generated TypeScript content
    """
    routes = get_all_routes()
    
    # Generate TypeScript content
    ts_content = """/**
 * Auto-generated API route definitions
 * DO NOT EDIT MANUALLY - This file is generated from Python route definitions
 * 
 * Generated at: {timestamp}
 */

/**
 * Type-safe API route builders
 * Each function returns a properly formatted API path with parameters
 */
export const API_ROUTES = {{
{route_definitions}
}} as const;

/**
 * Type definitions for route parameters
 */
{param_types}

/**
 * Helper type to extract route paths
 */
export type ApiRoutePath = string;

/**
 * Type-safe route builder function
 */
export type RouteBuilder<T extends any[] = []> = (...args: T) => string;

/**
 * Extract all API routes for validation
 */
export const ALL_ROUTES: string[] = [
{all_routes_list}
];
"""
    
    # Generate route definitions
    route_defs = []
    param_interfaces = []
    all_routes_list = []
    
    for category_name, category_routes in routes.items():
        category_def = f"  {category_name}: {{"
        route_items = []
        
        base_path = category_routes.get('_base', '')
        
        for route_name, route_info in category_routes.items():
            if route_name == '_base':
                continue
            
            path = route_info['path']
            params = route_info['params']
            
            # Build full path
            if base_path and path == '/':
                full_path = base_path
            elif base_path and not path.startswith(base_path):
                full_path = base_path + path
            else:
                full_path = path
            
            # Generate TypeScript function
            if params:
                # Create parameter type
                param_args = ', '.join([f"{p}: string" for p in params])
                
                # Build path with template literals
                ts_path = full_path
                for param in params:
                    ts_path = ts_path.replace(f"{{{param}}}", f"${{{param}}}")
                
                route_items.append(
                    f"    {route_name}: ({param_args}): string => `{ts_path}`"
                )
            else:
                route_items.append(
                    f"    {route_name}: (): string => '{full_path}'"
                )
            
            # Add to all routes list
            if not params:
                all_routes_list.append(f"  '{full_path}'")
        
        if route_items:
            category_def += "\n" + ",\n".join(route_items) + "\n  }"
            route_defs.append(category_def)
    
    # Generate parameter type definitions
    param_types_str = ""
    for category_name, category_routes in routes.items():
        interfaces = []
        for route_name, route_info in category_routes.items():
            if route_name == '_base':
                continue
            
            params = route_info['params']
            if params:
                interface_name = f"{category_name.title()}{route_name.title().replace('_', '')}Params"
                param_fields = '\n'.join([f"  {p}: string;" for p in params])
                interfaces.append(f"export interface {interface_name} {{\n{param_fields}\n}}")
        
        if interfaces:
            param_interfaces.extend(interfaces)
    
    if param_interfaces:
        param_types_str = '\n\n'.join(param_interfaces)
    else:
        param_types_str = "// No parameter interfaces needed"
    
    # Format the final content
    from datetime import datetime
    ts_content = ts_content.format(
        timestamp=datetime.now().isoformat(),
        route_definitions=',\n'.join(route_defs),
        param_types=param_types_str,
        all_routes_list=',\n'.join(all_routes_list)
    )
    
    # Write to file if output_dir provided
    if output_dir:
        output_path = Path(output_dir) / "routes.generated.ts"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(ts_content)
        print(f"Generated TypeScript routes at: {output_path}")
    
    return ts_content


def generate_route_map() -> Dict[str, str]:
    """
    Generate a simple mapping of route names to paths for runtime use.
    
    Returns:
        Dictionary mapping route keys to their full paths
    """
    routes = get_all_routes()
    route_map = {}
    
    for category_name, category_routes in routes.items():
        base_path = category_routes.get('_base', '')
        
        for route_name, route_info in category_routes.items():
            if route_name == '_base':
                continue
            
            path = route_info['path']
            
            # Build full path
            if base_path and path == '/':
                full_path = base_path
            elif base_path and not path.startswith(base_path):
                full_path = base_path + path
            else:
                full_path = path
            
            # Create a unique key for the route
            route_key = f"{category_name}.{route_name}"
            route_map[route_key] = full_path
    
    return route_map


def validate_frontend_backend_sync(frontend_routes_path: str) -> bool:
    """
    Validate that frontend routes match backend definitions.
    
    Args:
        frontend_routes_path: Path to the frontend routes file
    
    Returns:
        True if routes are in sync, False otherwise
    """
    # Get backend routes
    backend_routes = generate_route_map()
    
    # Read frontend routes file
    if not os.path.exists(frontend_routes_path):
        print(f"Frontend routes file not found: {frontend_routes_path}")
        return False
    
    with open(frontend_routes_path, 'r') as f:
        frontend_content = f.read()
    
    # Check each backend route exists in frontend
    missing_routes = []
    for route_key, route_path in backend_routes.items():
        # Simple check - could be made more sophisticated
        if route_path not in frontend_content:
            missing_routes.append(f"{route_key}: {route_path}")
    
    if missing_routes:
        print("Routes missing in frontend:")
        for route in missing_routes:
            print(f"  - {route}")
        return False
    
    return True


if __name__ == "__main__":
    # Generate TypeScript routes when run directly
    import sys
    
    if len(sys.argv) > 1:
        output_dir = sys.argv[1]
        generate_typescript_routes(output_dir)
    else:
        # Print to stdout
        print(generate_typescript_routes())
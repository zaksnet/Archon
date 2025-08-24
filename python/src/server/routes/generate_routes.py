#!/usr/bin/env python3
"""
Script to generate TypeScript route definitions for the frontend.

Run this script to update the frontend route definitions after making
changes to the backend routes.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.server.routes.route_generator import generate_typescript_routes


def main():
    """Generate TypeScript routes for the frontend."""
    
    # Determine the output directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent.parent  # Go up to multi-provider-extension-feature
    
    # Frontend routes directory
    frontend_routes_dir = project_root / "archon-ui-main" / "src" / "routes"
    
    # Ensure the directory exists
    frontend_routes_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate the routes
    print(f"Generating TypeScript routes...")
    print(f"Output directory: {frontend_routes_dir}")
    
    try:
        generate_typescript_routes(str(frontend_routes_dir))
        print("✅ TypeScript routes generated successfully!")
        
        # Also generate in the same directory for co-location
        local_output = script_dir / "routes.generated.ts"
        generate_typescript_routes(str(script_dir))
        print(f"✅ Also generated at: {local_output}")
        
    except Exception as e:
        print(f"❌ Error generating routes: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
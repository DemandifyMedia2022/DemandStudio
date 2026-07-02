#!/bin/bash

set -e

echo "Setting up CMS Portal..."

echo "Install dependencies with npm install if you have not already."
echo "Make sure DATABASE_URL points at your PostgreSQL database."

# Create admin user
echo "Creating admin user..."
echo "Email: admin@example.com"
echo "Password: admin123"
curl -X POST http://localhost:3000/api/users/seed || echo "Note: Server needs to be running to seed user. Start the server first with 'npm run dev' then run: curl -X POST http://localhost:3000/api/users/seed"

echo ""
echo "Setup complete!"
echo ""
echo "To start the development server, run: npm run dev"
echo "Then visit http://localhost:3000"
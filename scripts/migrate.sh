#!/bin/bash

load_env() {
    if [ -f .env.local ]; then
        set -a
        source .env.local
        set +a
    fi
}


new_migration() {
    if [ -z "$1" ]; then
        echo "Error: Migration description required"
        echo "Usage: bun run db:new \"description here\""
        exit 1
    fi
    echo "Migration file created"
    supabase migration new $1 
}

apply_migrations() {
  load_env

  echo "Running database migration..."
  supabase db push --include-all -p "$POSTGRES_PASSWORD"


  if [ $? -eq 0 ]; then
      echo "We good, dawg!"
  else
      echo "We not good, dawg"
      exit 1
  fi
}

case "$1" in
    new)
        new_migration "$2"
        ;;
    up)
        apply_migrations
        ;;
    *)
        echo "Usage: bun run db:<command> [args]"
        echo ""
        echo "Commands:"
        echo "  new \"description\"    Create a new migration file"
        echo "  up                     Apply all pending migrations"
        echo ""
        echo "Examples:"
        echo "  bun run db:new \"add users table\""
        echo "  bun run db:up"
        exit 1
        ;;
esac
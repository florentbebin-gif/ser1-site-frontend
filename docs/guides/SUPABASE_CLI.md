# Supabase CLI Commands

## Installation (local project)
```bash
npm install supabase --save-dev
```

## Common commands
```bash
# Help
npx supabase --help

# Login (first time)
npx supabase login

# Link to project (replace <PROJECT_REF>)
npx supabase link --project-ref <PROJECT_REF>

# Deploy admin function
npx supabase functions deploy admin

# Check functions status
npx supabase functions list
```

## Notes
- Use `npx supabase` instead of global `supabase` command
- Project ref available in Supabase Dashboard > Settings > API
- Ensure Docker is running for local development

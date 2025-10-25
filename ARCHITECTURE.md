flowchart TD
    U[Utilisateur<br/>navigateur] -->|HTTP/HTTPS| FE[Vercel<br/>ser1-site-frontend]
    FE -->|REST /api/*| BE[Render<br/>ser1-backend (Express)]
    BE -->|SQL & Auth| DB[Supabase<br/>PostgreSQL + Auth]
    subgraph GitHub
      GFE[repo: ser1-site-frontend] -->|CI/CD| V[Vercel]
      GBE[repo: ser1-backend] -->|CI/CD| R[Render]
    end
    classDef box fill:#f7fafc,stroke:#94a3b8,color:#111827,stroke-width:1px
    class FE,BE,DB,U,GFE,GBE,V,R box

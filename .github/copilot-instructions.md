## Proyecto Base (Referencia)
Cuando el usuario diga **"guíate del proyecto base"**, debes revisar la estructura, componentes y recursos ubicados en:
`C:\Users\DESARROLLO\Documents\Documentacion IEPC\metronic-v9.3.3\metronic-tailwind-react-demos\typescript\nextjs`

Úsala como referencia para patrones de código, estructura de carpetas, componentes reutilizables y configuraciones.

## Project Structure
# The Metronic Next.js project follows a well-organized structure based on the App Router:

app/                    # Next.js App Router directory
├── (auth)/             # Authentication routes (signin, signup, etc.)
├── (protected)/        # Protected routes requiring authentication
│   ├── account/        # Account settings pages
│   ├── page.tsx        # Dashboard page (default protected route)
│   └── layout.tsx      # Layout for protected routes
├── components/         # Shared UI components
│   ├── layouts/        # Multiple demo layouts (Demo1-Demo10)
│   └── ui/             # Base UI components
├── models/             # Data models and interfaces
└── layout.tsx          # Root layout component

components/             # Global UI components
config/                 # Configuration files
hooks/                  # Custom React hooks
i18n/                   # Internationalization files
lib/                    # Utility libraries
providers/              # React context providers
├── auth-provider.tsx   # Authentication provider
├── i18n-provider.tsx   # Internationalization provider
├── settings-provider.tsx # App settings provider
├── theme-provider.tsx  # Dark/light theme provider
public/                 # Static assets (images, fonts, etc.)
types/                  # TypeScript type definitions
styles/                    # Global CSS styles

### Formato JSON de Respuesta del servidor
```json
{
  "status": 200,
  "message": "Operacion exitosa",
  "data": { ... }    // Objeto, array, o null
}
```
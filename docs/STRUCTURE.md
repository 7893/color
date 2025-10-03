# Project Structure

```
color/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deployment workflow
├── public/
│   └── index.html              # Entry HTML file
├── src/
│   ├── app/
│   │   └── PaletteApp.js       # Main application class
│   ├── config/
│   │   └── constants.js        # Configuration constants
│   ├── data/
│   │   └── colors.js           # Color palette data
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── styles/
│   │   └── main.css            # Main stylesheet
│   ├── utils/
│   │   ├── gl.js               # WebGL utilities
│   │   └── helpers.js          # Helper functions
│   └── main.js                 # Application entry point
├── worker/
│   └── index.js                # Cloudflare Worker
├── dist/                       # Build output (ignored)
├── node_modules/               # Dependencies (ignored)
├── .gitignore                  # Git ignore rules
├── package.json                # Project metadata
├── pnpm-lock.yaml              # Lock file
├── README.md                   # Project documentation
├── schema.sql                  # Database schema
├── vite.config.js              # Vite configuration
└── wrangler.toml               # Cloudflare configuration
```

## Architecture

- **Modular Structure**: Separated concerns into app, config, data, services, styles, and utils
- **Modern Build**: Vite for fast development and optimized production builds
- **CI/CD**: GitHub Actions for automated deployment
- **Hardware Acceleration**: CSS transforms and WebGL for smooth animations

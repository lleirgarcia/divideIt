# divideIt Frontend

Modern, accessible, and performant frontend application built with Next.js 14, React 18, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI/UX**: Beautiful, responsive design with dark mode support
- ♿ **Accessibility**: WCAG compliant with ARIA labels, keyboard navigation, and screen reader support
- 🚀 **Performance**: Optimized with code splitting, lazy loading, and image optimization
- 🔍 **SEO**: Comprehensive metadata, Open Graph tags, and structured data
- 🧪 **Testing**: Comprehensive test coverage with Jest and React Testing Library
- 📱 **Mobile-First**: Fully responsive design optimized for all screen sizes
- 🌙 **Dark Mode**: Manual toggle with system preference detection

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Video Player**: react-player (lazy loaded)
- **File Upload**: react-dropzone
- **Notifications**: react-hot-toast
- **Testing**: Jest, React Testing Library
- **Build Tool**: Next.js built-in bundler

## Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── DarkModeToggle.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── VideoUploader.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── SegmentsList.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── StructuredData.tsx
│   ├── store/               # State management
│   │   └── videoStore.ts   # Zustand store
│   └── services/           # API services
│       └── api.ts
├── public/                  # Static assets
├── __tests__/              # Test files
└── config files            # Next.js, Tailwind, TypeScript configs
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Component Architecture

### UI Components

Reusable components in `src/components/ui/`:

- **Button**: Accessible button with variants and loading states
- **Input**: Form input with label, error, and helper text support
- **DarkModeToggle**: Dark mode switcher with localStorage persistence
- **LoadingSkeleton**: Loading placeholder component

### Feature Components

- **VideoUploader**: Drag-and-drop video upload with validation
- **VideoPlayer**: Video playback with lazy-loaded ReactPlayer
- **SegmentsList**: List of generated segments with download functionality
- **ErrorBoundary**: Error handling component

## Accessibility Features

- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ Semantic HTML
- ✅ Color contrast compliance
- ✅ Reduced motion support

## Performance Optimizations

- Code splitting with dynamic imports
- Lazy loading for ReactPlayer
- Image optimization (Next.js Image component ready)
- CSS optimization with Tailwind
- Compression enabled
- ETags for caching
- SWC minification

## SEO Features

- Comprehensive metadata
- Open Graph tags
- Twitter Card support
- Structured data (JSON-LD)
- Semantic HTML
- Sitemap ready

## Dark Mode

Dark mode is implemented with:
- Manual toggle button
- System preference detection
- localStorage persistence
- Smooth transitions

## Testing Strategy

- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **Accessibility Tests**: ARIA and keyboard navigation
- **Coverage Target**: 80%+

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Best Practices

1. **Component Design**: Keep components small and focused
2. **State Management**: Use Zustand for global state, local state for UI
3. **Accessibility**: Always include ARIA labels and keyboard support
4. **Performance**: Lazy load heavy components
5. **Testing**: Write tests for critical user flows
6. **Type Safety**: Use TypeScript types strictly

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure accessibility compliance
4. Update documentation
5. Run linter before committing

## License

See main project LICENSE file.

# 🚀 Whop Lead Engine - Frontend

**Production-Ready Premium SaaS Dashboard for AI-Powered Lead Generation**

A modern, beautiful, and fully-featured frontend for the Whop Lead Engine platform built with Next.js 14, TypeScript, TailwindCSS, and Framer Motion.

## ✨ Features

### 🎨 **Premium Design System**
- Modern glassmorphism effects and gradient backgrounds
- Smooth animations with Framer Motion
- Dark/light mode support with next-themes
- Responsive design for all devices
- Premium component library based on ShadCN/UI

### 📊 **Complete Dashboard Suite**
- **Dashboard Home**: Real-time stats, charts, and activity feed
- **Leads Management**: Advanced table with filtering, search, and actions
- **Member Retention**: Churn prediction and engagement analytics
- **Payments**: Revenue tracking and Stripe integration
- **Analytics**: Comprehensive performance insights
- **Settings**: API key management and configuration

### 🔐 **Authentication System**
- Elegant login/signup pages with glassmorphism design
- Form validation with React Hook Form + Zod
- Demo account functionality for testing
- JWT token management

### 🚀 **Premium UX/UI**
- Framer Motion page transitions and micro-interactions
- Custom loading states and skeleton loaders
- Toast notifications with Sonner
- Advanced data visualization with Recharts
- Professional status indicators and badges

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + Custom CSS Variables
- **Animations**: Framer Motion
- **UI Components**: ShadCN/UI + Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Theme**: next-themes
- **Notifications**: Sonner

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

### Demo Access
The frontend includes demo functionality:
- Use "Continue as Demo User" on login page
- Or use "Try Demo Account" on signup page
- All features work with dummy data

## 📁 Project Structure

```
whop-lead-gen/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Dashboard pages
│   │   ├── leads/              # Leads management
│   │   ├── retention/          # Member retention
│   │   ├── payments/           # Revenue tracking
│   │   ├── analytics/          # Performance insights
│   │   ├── settings/           # Configuration
│   │   ├── layout.tsx          # Dashboard layout
│   │   └── page.tsx            # Dashboard home
│   ├── login/                  # Login page
│   ├── signup/                 # Signup page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing/redirect page
├── components/                  # Reusable components
│   ├── ui/                     # Base UI components
│   ├── charts/                 # Chart components
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── navbar.tsx              # Top navigation
│   ├── theme-provider.tsx      # Theme context
│   └── ...                     # Feature components
├── lib/                        # Utilities
│   ├── api.ts                  # API client
│   └── utils.ts                # Helper functions
├── types/                      # TypeScript types
├── data/                       # Dummy data
└── hooks/                      # Custom hooks
```

## 🎨 Design System

### Color Palette
The design uses a sophisticated color system:
- **Primary**: Blue gradient (600-500)
- **Secondary**: Purple accent
- **Success**: Green (500)
- **Warning**: Yellow (500)
- **Error**: Red (500)
- **Muted**: Gray variations

### Typography
- **Headings**: Cal Sans (display font)
- **Body**: Inter (system font)
- **Code**: Monaco/Consolas

### Components
All components follow the ShadCN/UI design system with custom enhancements:
- Consistent spacing and sizing
- Accessible color contrasts
- Smooth transitions and animations
- Professional micro-interactions

## 🔌 Backend Integration

### API Client
The frontend includes a complete API client (`lib/api.ts`) with:
- Type-safe API calls
- Error handling
- Authentication token management
- Dummy data fallbacks for development

### Environment Variables
Configure these in your deployment:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Connecting to Backend
The frontend is designed to seamlessly connect to the FastAPI backend:

1. **Update API URL**: Set `NEXT_PUBLIC_API_URL` to your backend URL
2. **Authentication**: JWT tokens are automatically managed
3. **Error Handling**: Graceful fallbacks to dummy data during development
4. **Type Safety**: Full TypeScript support for all API responses

## 📱 Responsive Design

The dashboard is fully responsive:
- **Mobile**: Optimized sidebar and navigation
- **Tablet**: Adaptive grid layouts
- **Desktop**: Full feature experience
- **Large screens**: Expanded layouts and additional content

## 🎭 Animations & Interactions

### Page Transitions
- Smooth fade-in animations on page load
- Staggered animations for lists and grids
- Loading states with skeleton UI

### Micro-interactions
- Button hover effects and active states
- Card hover animations with scale
- Progress bars and loading indicators
- Toast notifications for user feedback

### Performance
- Optimized animations with Framer Motion
- Lazy loading for components
- Debounced search inputs
- Efficient re-renders with React optimization

## 🔒 Security Features

- **Input Validation**: All forms use Zod validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based authentication
- **Secure Storage**: Safe localStorage usage
- **Route Protection**: Authentication guards

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Manual Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Configure any additional environment variables
3. Deploy to your preferred platform

## 🧪 Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Development Tips
1. **Dummy Data**: All pages work with realistic dummy data
2. **Hot Reload**: Changes reflect immediately
3. **Type Safety**: Full TypeScript support
4. **Component Preview**: Use Storybook (if configured)

## 🎯 Features in Detail

### Dashboard Home
- Real-time statistics with trend indicators
- Interactive charts showing growth over time
- Recent activity feed with animated items
- Quick action buttons and system status

### Leads Management
- Advanced data table with sorting and filtering
- Search functionality across all lead data
- Bulk actions and individual lead management
- Quality grading and intent scoring visualization

### Member Retention
- Churn risk prediction with visual indicators
- Member engagement scoring
- Automated retention campaign triggers
- Interactive member cards with actions

### Payments & Analytics
- Revenue tracking with growth visualization
- Conversion funnel analysis
- ROI calculations and projections
- Stripe integration status and configuration

### Settings
- Secure API key management with show/hide
- Platform configuration options
- User profile management
- Integration status monitoring

## 🤝 Contributing

1. **Code Style**: Follow existing patterns and conventions
2. **Components**: Use the established component architecture
3. **Types**: Maintain strict TypeScript typing
4. **Animations**: Keep animations smooth and purposeful
5. **Responsive**: Test on all device sizes

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the component documentation
2. Review the API client implementation
3. Examine dummy data structure
4. Follow the established patterns

---

**Built with ❤️ for the Whop community**

This frontend represents production-ready code that you can immediately deploy and customize for your needs. Every component is built with attention to detail, performance, and user experience.
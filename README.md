# 🏋️ AI Gym Tracker

A modern, local-first fitness tracking Progressive Web App built with Next.js 15 and TypeScript. Track your workouts, manage templates, and monitor your progress - all while working offline.

## 🚀 Live Demo

**Try it now:** [https://laurosollero.github.io/ai-gym-tracker/](https://laurosollero.github.io/ai-gym-tracker/)

Install as a PWA on your mobile device for the best experience!

## ✨ Features

### 🏃‍♂️ Core Workout Tracking
- **Exercise Library**: 20+ built-in exercises + custom exercise creation
- **Workout Sessions**: Log sets with weight, reps, rest times, and RPE
- **Rest Timer**: Automatic rest timing with visual progress
- **Session History**: Complete workout history with detailed analytics

### 📊 Progress Analytics  
- **Personal Records**: Automatic PR detection and tracking
- **Progress Charts**: Visual progress tracking per exercise
- **Volume Analysis**: Weekly and monthly volume trends
- **1RM Calculator**: Estimated 1-rep max with projections
- **Body Measurements**: Track weight, body fat, and custom metrics

### 📋 Template System
- **Template Builder**: Create workout templates from scratch (Coach Mode)
- **Template Library**: Browse and organize workout templates
- **Template Sharing**: Share templates via URLs and QR codes
- **Import/Export**: Bulk template operations for coaching workflows
- **Auto-Import**: Seamless template import from shared links

### 🛠️ Advanced Tools
- **Plate Calculator**: Visual barbell loading calculator
- **Exercise Media**: YouTube videos, GIFs, and instruction support
- **PWA Installation**: Install as a native app on any device
- **Offline First**: Full functionality without internet connection
- **Responsive Design**: Optimized for mobile and desktop

## 🏗️ Technical Stack

- **Framework**: Next.js 15 with Turbopack
- **Database**: IndexedDB via Dexie.js (local-first)
- **UI**: ShadCN UI components + Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts for analytics
- **QR Codes**: qrcode library for template sharing
- **PWA**: Custom service worker for offline functionality

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/laurosollero/ai-gym-tracker.git
   cd ai-gym-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
npm run build      # Build for deployment
npm run export     # Generate static export for GitHub Pages
```

## 📱 PWA Installation

The app can be installed as a Progressive Web App:

1. **Mobile**: Use "Add to Home Screen" option in your browser
2. **Desktop**: Look for the install prompt in the address bar
3. **Manual**: Use browser settings to install PWA

## 🎯 Usage

### Quick Start Workout
1. Open the app and tap "Start Workout"
2. Add exercises using the exercise selector
3. Log your sets with weight and reps
4. Use the automatic rest timer between sets
5. Finish and review your session

### Template Sharing
1. Create or edit a template
2. Use the share button to generate a URL/QR code
3. Share with others for instant template import
4. Recipients can preview and import with one tap

### Coach Mode
1. Navigate to "Templates" → "Create Template"
2. Build detailed workout programs without performing them
3. Set target weights, reps, RPE, and rest times
4. Export templates for athletes or personal use

## 🛣️ Roadmap

- **Phase 4**: Supabase integration for cloud sync and user accounts
- **Phase 5**: AI-powered recommendations and advanced analytics
- **Phase 6**: Social features and community template marketplace
- **Phase 7**: Wearable integrations and mobile apps
- **Phase 8**: Enterprise coaching tools and multi-athlete management

## 🤝 Contributing

This is currently a personal project, but feedback and suggestions are welcome! Feel free to:

- Open issues for bug reports or feature requests
- Share your experience using the app
- Suggest improvements or new features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [ShadCN/UI](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Deployed on [GitHub Pages](https://pages.github.com/)

---

**Start tracking your fitness journey today!** 💪

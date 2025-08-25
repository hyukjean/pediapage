# Pedia.page

🚀 **Interactive AI-Powered Learning Platform**

An intelligent flashcard generation and chat system that creates beautiful, interactive learning materials using Google's Gemini AI. Features a physics-based hexagonal card layout with drag-and-drop interactions and conversational AI capabilities.

## ✨ Features

### 🎯 **Smart Flashcard Generation**
- Generate flashcards from any topic using Google Gemini AI (FREE)
- Automatic or custom card count (3-25 cards)
- Basic or detailed content levels
- Multi-language support (English, Korean, Japanese, German, Italian, Norwegian)

### 🎨 **Beautiful Physics-Based UI**
- Hexagonal grid layout (honeycomb pattern)
- Drag-and-drop card interactions
- Smooth animations and glass-morphism design
- Mobile-friendly touch support

### 💬 **Interactive Chat System**
- Select cards using "+" buttons
- Ask questions about selected cards
- Get concise, Grok-style AI responses
- Generate new cards from selected combinations

### 🌐 **Multi-Language Support**
- Full internationalization (i18n)
- Dynamic language switching
- Localized content generation

## 🚀 Production Deployment

**Three deployment options to eliminate API key setup hassle for your users:**

### 🆓 Option 1: Free Demo Service (Recommended)
Perfect for letting users try your service without any setup:
- **Users**: 10 free uses per day, no API key needed
- **You**: Set `DEMO_GEMINI_API_KEY` environment variable
- **Benefits**: Zero friction for users, easy user acquisition

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/hyukjean/pedia.page)

### 💰 Option 2: Premium Service
Build a subscription-based AI service:
- **Free Tier**: 5 uses/day, basic features
- **Premium**: Unlimited usage, advanced AI model
- **Monetization**: Built-in Stripe integration ready

### 🔧 Option 3: Personal API Key (Traditional)
Let users manage their own API costs:
- **Users**: Set up their own Gemini API key
- **Benefits**: Unlimited usage, user pays directly to Google
- **Drawback**: Higher setup friction

> 📖 **Complete deployment guide with code examples**: [DEPLOY.md](./DEPLOY.md)

---

### Quick Netlify Setup:

1. **Fork this repository** to your GitHub account

2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings are auto-configured via `netlify.toml`

3. **Set Environment Variables:**
   - In Netlify dashboard → Site settings → Environment variables
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here`

4. **Deploy automatically!** 
   - Your site will be available at `https://your-site-name.netlify.app`
   - API calls work without exposing keys to users

### Option 2: Vercel

1. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Set Environment Variables:**
   - In project settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here`

3. **Deploy!** Your site will be live with serverless API

### Option 3: Custom Domain + CDN

Use any static hosting with serverless functions:
- AWS (S3 + Lambda)
- Google Cloud (Cloud Storage + Cloud Functions)
- Azure (Static Web Apps)

## 🔒 Security Features

✅ **API Key Protection**: Keys stored server-side only  
✅ **CORS Headers**: Proper cross-origin configuration  
✅ **Error Handling**: Graceful fallbacks  
✅ **Rate Limiting**: Built into Gemini API  

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pedia.page-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up API key**
   - Get your FREE API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create `.env.local` file:
     ```bash
     GEMINI_API_KEY=your_actual_api_key_here
     ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

## 🎮 How to Use

### Generate Flashcards
1. Enter a topic (e.g., "Explain quantum physics")
2. Choose detail level (Basic/Detailed)
3. Set card count (Auto/Custom)
4. Click "Generate"

### Chat with Cards
1. Click "+" buttons on cards to select them
2. Enter your question in the chat interface
3. Get AI-powered responses about selected topics
4. Use "Create Cards from Selection" for deeper exploration

### Navigate & Explore
- Click cards to expand/collapse
- Drag cards to rearrange
- Use breadcrumbs for navigation history
- Switch languages anytime

## 🛠️ Technology Stack

- **Frontend**: TypeScript, HTML5, CSS3
- **Build Tool**: Vite
- **AI**: Google Gemini 2.0 Flash (FREE API)
- **Physics**: Custom physics simulation
- **Styling**: CSS Glass-morphism, CSS Grid/Flexbox
- **I18n**: Custom internationalization system

## 🎨 Key Components

### Core Files
- `src/main.ts` - Application entry point
- `src/api.ts` - Gemini AI integration
- `src/physics.ts` - Hexagonal layout & drag system
- `src/ui.ts` - User interface logic
- `src/state.ts` - State management

### Styling
- `styles/main.css` - Main stylesheet coordinator
- `styles/base.css` - Base styles & variables
- `styles/chatbot.css` - Chat interface styles
- `styles/graph.css` - Card physics styles
- `styles/layout.css` - Layout & responsive design

## 🔧 Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
```

### Vite Configuration
The app uses Vite with TypeScript support and environment variable injection.

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile

## 🆓 Free Usage

This app uses Google Gemini's FREE tier:
- **15 requests per minute**
- **1M tokens per minute**
- **1,500 requests per day**
- **$0 cost**

Perfect for personal learning and education!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language generation
- Vite for blazing fast development experience
- The open-source community for inspiration

---

**Made with ❤️ for learners everywhere**

*Transform any topic into an interactive learning experience!*

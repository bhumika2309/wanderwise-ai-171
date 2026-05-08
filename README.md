# WanderWise AI 🌍✈️

### AI-Powered Trip Planner Web Application

WanderWise AI is a full-stack AI-powered travel planning platform that generates personalized travel itineraries based on user preferences such as destination, budget, duration, and interests. The application combines AI-generated planning, real-time weather updates, maps integration, and trip management into a modern, production-ready web application.

---

# 🚀 Features

## 🔐 User Authentication

* JWT-based Signup/Login system
* Secure authentication and protected routes
* User profile and saved trips management

## 🧠 AI Itinerary Generator

* Generate personalized day-wise travel itineraries using OpenAI/Gemini API
* AI-generated:

  * Places to visit
  * Suggested timings
  * Travel tips
  * Budget-friendly recommendations
* Structured JSON-based itinerary generation

## 📝 Dynamic Trip Planning

* Create customized trips using:

  * Destination
  * Number of days
  * Budget
  * Travel interests
* Edit and regenerate specific itinerary days dynamically

## 🗺️ Google Maps Integration

* Display trip locations on interactive Google Maps
* Add map markers for destinations
* Route visualization between places

## 🌦️ Weather Forecast

* Real-time weather integration
* Forecast display for selected travel dates

## 💰 Budget Breakdown

* Estimated spending analysis for:

  * Accommodation
  * Food
  * Transportation
* AI adjusts recommendations based on budget constraints

## 💾 Save & Manage Trips

* Save trips to MongoDB
* View previous trips
* Edit/Delete saved itineraries

## 🤖 AI Chat Assistant

* Conversational AI trip planner
* Example:

  > “Plan a 3-day Goa trip under 10k”
* AI responds with a complete itinerary instantly

---

# 🖥️ Tech Stack

## Frontend

* React.js
* Tailwind CSS
* Axios
* React Router DOM

## Backend

* Node.js
* Express.js
* JWT Authentication

## Database

* MongoDB
* Mongoose

## AI Integration

* OpenAI API / Gemini API

## APIs & Services

* Google Maps API
* Weather API

## Deployment

* Frontend: Vercel
* Backend: Render / Railway

---

# 📂 Project Structure

```bash
wanderwise-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/bhumika2309/wanderwise-ai-171.git
cd wanderwise-ai-171
```

---

## 2️⃣ Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the server directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
GOOGLE_MAPS_API_KEY=your_maps_key
WEATHER_API_KEY=your_weather_key
```

---

# ▶️ Run Application

## Start Backend

```bash
cd server
npm run dev
```

## Start Frontend

```bash
cd client
npm start
```

---

# 🧠 AI Prompt Engineering

The application uses structured prompt engineering to ensure:

* JSON formatted responses
* Day-wise itinerary breakdown
* Budget-aware suggestions
* Clean and predictable AI outputs

Example AI Prompt:

```json
{
  "destination": "Goa",
  "days": 3,
  "budget": "medium",
  "interests": ["beaches", "food", "nightlife"]
}
```

---

# 🎨 UI/UX Highlights

* Modern responsive UI using Tailwind CSS
* Dashboard-style layout
* Smooth animations and transitions
* Loading skeletons during AI generation
* Mobile-first responsive design

---

# 📈 Future Enhancements

* Redis caching for optimized API performance
* Trip sharing via public links
* Download itinerary as PDF
* AI-based hotel and restaurant recommendations
* Multi-language support

---

# 🧪 Testing & Validation

* Form validation for all user inputs
* API error handling middleware
* Graceful handling of AI/API failures
* Secure authentication flow testing

---

# 🚀 Deployment

## Frontend

Deploy on Vercel:

```bash
vercel deploy
```

## Backend

Deploy on Render or Railway.

---

# 👩‍💻 Author

**Bhumika Sahu**
AI-First Full Stack Developer passionate about building scalable AI-powered applications using modern web technologies and intelligent workflows.

GitHub:
[bhumika2309/wanderwise-ai-171](https://github.com/bhumika2309/wanderwise-ai-171?utm_source=chatgpt.com)

# AI Resume Analyser

A web application that analyzes resumes against job descriptions using AI (Google Gemini) and provides a match score along with matched and missing skills.

## Deployment Instructions

### 1. Environment Variables
You need to set the following environment variables on your hosting provider (e.g., Render, Heroku, Railway):

- `MONGO_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas).
- `GEMINI_API_KEY`: Your Google Gemini API key.
- `PORT`: (Optional) The port the server will run on (defaults to 5000).

### 2. Local Setup
1. Install dependencies for both backend and frontend:
   ```bash
   npm run install-all
   ```
2. Create a `.env` file in the `BACKEND` directory with your `MONGO_URI` and `GEMINI_API_KEY`.

### 3. Deployment Steps
The project is configured to run as a single unit where the Node.js backend serves the React frontend.

1. **Build the Frontend**:
   ```bash
   npm run build
   ```
   This generates the `FRONTEND/dist` folder.

2. **Start the Server**:
   ```bash
   npm start
   ```
   The backend will serve the static files from `FRONTEND/dist` and handle the API requests.

### Configuration on Hosting Providers
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `.` (the project root)

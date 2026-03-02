# SenpAI

A strict, Socratic AI coding tutor designed for Software Engineering, LeetCode, High-Level/Low-Level Design, and AI system architecture. SenpAI never gives you the direct answer; it guides you through questions to help you understand the solution yourself.

## 🚀 Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** Vanilla HTML/CSS/JS (Mobile Responsive UI)
- **Database:** Neon Serverless PostgreSQL (Stores permanent chat history)
- **AI Infrastructure:** OpenRouter API
  - **Models:** DeepSeek V3.2, Qwen3 Coder Next, Stepfun Flash

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/manish2866/senpai.git
   cd senpai
   ```

2. Create a virtual environment and activate it:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables locally (Create a `.env` file):
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key
   DATABASE_URL=your_neon_postgres_url
   ```

5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## ☁️ Deployment

SenpAI is configured to deploy instantly on [Render](https://render.com/). 
Simply connect the GitHub repository, set your `OPENROUTER_API_KEY` and `DATABASE_URL` as Environment Variables inside the Render Dashboard, and hit deploy!

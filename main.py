from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import json
import time

from sqlalchemy import create_engine, Column, String, Float, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

app = FastAPI(title="SenpAI")
app.mount("/static", StaticFiles(directory="static"), name="static")

from prompts import MASTER

# ── PostgreSQL storage ──
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is missing!")

# SQLAlchemy Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBSession(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    history = Column(Text, nullable=False, default="[]")
    created_at = Column(Float, nullable=False)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Models ──
class ChatRequest(BaseModel):
    message: str
    history: list[dict]
    model: str = "openrouter/deepseek/deepseek-v3.2"

class Session(BaseModel):
    id: str
    title: str
    history: list[dict]
    createdAt: float


from fastapi import Depends
from sqlalchemy.orm import Session as SQLAlchemySession

# ── Routes ──
@app.get("/", response_class=HTMLResponse)
async def root():
    with open("static/index.html") as f:
        return f.read()

@app.get("/sessions")
async def get_sessions(db: SQLAlchemySession = Depends(get_db)):
    sessions = db.query(DBSession).order_by(DBSession.created_at.desc()).all()
    result = {}
    for s in sessions:
        result[s.id] = {
            "id": s.id,
            "title": s.title,
            "history": json.loads(s.history),
            "createdAt": s.created_at,
        }
    return result

@app.post("/sessions/{session_id}")
async def upsert_session(session_id: str, session: Session, db: SQLAlchemySession = Depends(get_db)):
    try:
        db_session = db.query(DBSession).filter(DBSession.id == session_id).first()
        history_str = json.dumps(session.history)
        
        if db_session:
            db_session.title = session.title
            db_session.history = history_str
        else:
            db_session = DBSession(
                id=session_id,
                title=session.title,
                history=history_str,
                created_at=session.createdAt
            )
            db.add(db_session)
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving session: {e}")
    return {"ok": True}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, db: SQLAlchemySession = Depends(get_db)):
    db_session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
    return {"ok": True}

@app.post("/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": MASTER}]
    messages += req.history
    messages.append({"role": "user", "content": req.message})

    def generate():
        try:
            or_key = os.getenv("OPENROUTER_API_KEY")
            if not or_key:
                yield f"data: {json.dumps({'content': '⚠️ OpenRouter API key missing. Please add OPENROUTER_API_KEY to your backend or .env file.'})}\n\n"
                yield "data: [DONE]\n\n"
                return

            from openai import OpenAI
            or_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=or_key,
            )
            # Assign specific max_tokens per model to optimize usage
            or_model = req.model.replace("openrouter/", "")
            or_tokens = 8192
            
            stream = or_client.chat.completions.create(
                model=or_model,
                messages=messages,
                stream=True,
                temperature=0.6,
                max_tokens=or_tokens,
            )

            for chunk in stream:
                if len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield f"data: {json.dumps({'content': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'content': f'⚠️ Error: {str(e)}'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

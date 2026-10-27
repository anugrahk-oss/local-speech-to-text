import os
import tempfile
import time

import mlx_whisper
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Local Arabic Transcription API")

# Allow requests from your local React development server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MODEL = "mlx-community/whisper-large-v3-turbo"

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL,
    }


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    extension = os.path.splitext(file.filename or "")[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format.",
        )

    temp_path = None

    try:
        # Save uploaded audio to a temporary file.
        with tempfile.NamedTemporaryFile(
            suffix=extension,
            delete=False,
        ) as temp:
            temp_path = temp.name
            size = 0

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="Audio file exceeds the 25 MB limit.",
                    )

                temp.write(chunk)

        start_time = time.perf_counter()

        result = mlx_whisper.transcribe(
            temp_path,
            path_or_hf_repo=MODEL,
            language="Arabic",
            task="transcribe",
        )

        elapsed = time.perf_counter() - start_time

        return {
            "text": result["text"].strip(),
            "processing_time_seconds": round(elapsed, 2),
            "model": MODEL,
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(f"Transcription error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Transcription failed. Check the Python server logs.",
        )

    finally:
        await file.close()

        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
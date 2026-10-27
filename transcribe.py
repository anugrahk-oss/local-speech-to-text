import mlx_whisper

result = mlx_whisper.transcribe(
    "arabic.wav",
    path_or_hf_repo="mlx-community/whisper-large-v3-turbo",
    language="Arabic",
    task="transcribe",
)

print("Transcription:")
print(result["text"])
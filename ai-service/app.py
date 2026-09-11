import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form
from transformers import AutoImageProcessor, AutoModel
from PIL import Image
import torch
import io
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "items"
VECTOR_SIZE = 384

app = FastAPI()

processor = AutoImageProcessor.from_pretrained("facebook/dinov2-small")
model = AutoModel.from_pretrained("facebook/dinov2-small")
model.eval()

qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

# Create collection on startup if it doesn't exist
@app.on_event("startup")
def setup_qdrant():
    existing = [c.name for c in qdrant.get_collections().collections]
    if COLLECTION_NAME not in existing:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
        print(f"Created Qdrant collection: {COLLECTION_NAME}")
    else:
        print(f"Qdrant collection already exists: {COLLECTION_NAME}")


def get_embedding(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state[:, 0, :].squeeze().tolist()
    return embedding


@app.post("/embed")
async def embed(file: UploadFile = File(...)):
    image_bytes = await file.read()
    embedding = get_embedding(image_bytes)
    return {"embedding": embedding, "dim": len(embedding)}


@app.post("/store")
async def store(item_id: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    embedding = get_embedding(image_bytes)

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={"item_id": item_id},
            )
        ],
    )
    return {"status": "stored", "item_id": item_id, "dim": len(embedding)}


@app.post("/search")
async def search(file: UploadFile = File(...), top_k: int = Form(5)):
    image_bytes = await file.read()
    embedding = get_embedding(image_bytes)

    results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=embedding,
        limit=top_k,
    )

    matches = [
        {"item_id": point.payload.get("item_id"), "score": point.score}
        for point in results.points
    ]
    return {"matches": matches}


@app.get("/")
def health():
    return {"status": "ok"}
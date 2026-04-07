import chromadb
from mistralai import Mistral
from dotenv import load_dotenv
load_dotenv()
import os

api_key = os.getenv("MISTRAL_API_KEY")




# Load persisted ChromaDB
persist_directory = "./chroma"
client = chromadb.PersistentClient(path=persist_directory)

collection = client.get_collection(name="sde_questions")

model_emb = "mistral-embed"
client_emb = Mistral(api_key=api_key)
# Define batch embedding function
def get_embeddings_by_chunks(data, chunk_size):
    data = [str(d) for d in data if isinstance(d, str)]
    chunks = [data[x : x + chunk_size] for x in range(0, len(data), chunk_size)]
    embeddings_response = [
        client_emb.embeddings.create(model=model_emb, inputs=c) for c in chunks
    ]
    return [d.embedding for e in embeddings_response for d in e.data]

def retrieve_questions(query=None, difficulty=None, category=None, top_n=5):
    query_embedding = get_embeddings_by_chunks([query], 1)[0] if query else None
    results = collection.query(query_embeddings=[query_embedding] if query else None, n_results=top_n)

    # Ensure results contain expected keys
    metadata_results = results.get("metadatas", [[]])[0]

    # Filter results based on optional criteria
    filtered_results = [
        (meta["question"], meta["answer"], meta["difficulty"], meta["category"])
        for meta in metadata_results

    ]

    return filtered_results

# Example usage
# query = "Introduction of yourself"
# difficulty = 3  # Difficulty level between 1-5

# relevant_questions = retrieve_questions(query)
# print(len(relevant_questions))

# # Display results
# for q, a, d, c in relevant_questions:
#     print(f"Q: {q}\nA: {a}\nDifficulty: {d}, Category: {c}\n")
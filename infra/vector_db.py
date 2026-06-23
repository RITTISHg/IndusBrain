import os
import chromadb
from chromadb.config import Settings
# Suppress warning logs
import logging
logging.getLogger('chromadb').setLevel(logging.ERROR)

class IndusVectorStore:
    def __init__(self):
        host = os.getenv("CHROMADB_HOST", "localhost")
        port = int(os.getenv("CHROMADB_PORT", "8000"))
        
        # Connect to ChromaDB container client
        self.client = chromadb.HttpClient(host=host, port=port, settings=Settings(allow_reset=True))
        
        # Initialize or fetch collection
        self.collection = self.client.get_or_create_collection(
            name="indus_compliance_documents",
            metadata={"hnsw:space": "cosine"} # Use cosine similarity for engineering documents
        )

    def index_document_chunk(self, chunk_id: str, content: str, doc_name: str, 
                             section: str = None, category: str = None):
        """
        Store a document chunk with embedded vector payload.
        In production, LangChain or Google GenAI embeddings can be supplied as the embedding list.
        """
        self.collection.add(
            ids=[chunk_id],
            documents=[content],
            metadatas=[{
                "source": doc_name,
                "section": section or "General",
                "category": category or "Technical Standard"
            }]
        )

    def retrieve_similar_context(self, query: str, limit: int = 3):
        """
        Query the semantic store for relative context paragraphs.
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        # Format list results elegantly
        formatted_matches = []
        if results and 'documents' in results and len(results['documents']) > 0:
            for idx in range(len(results['documents'][0])):
                formatted_matches.append({
                    "id": results['ids'][0][idx],
                    "content": results['documents'][0][idx],
                    "metadata": results['metadatas'][0][idx],
                    "distance": results['distances'][0][idx] if 'distances' in results else None
                })
        return formatted_matches

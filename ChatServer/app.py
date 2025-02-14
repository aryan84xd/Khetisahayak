from flask import Flask, request, jsonify
from langchain_community.document_loaders import TextLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import os
import re

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
gemini_api_key = os.getenv("GEMINI_APIKEY")

# Configure Google Generative AI client
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize vector database and index
vector_store = None

def initialize_vector_store():
    global vector_store
    text_name = 'data.txt'
    loaders = [TextLoader(text_name)]
    
    # Use LangChain to create vectorstore with FAISS
    index = VectorstoreIndexCreator(
        embedding=HuggingFaceEmbeddings(model_name='all-MiniLM-L12-v2'), 
        vectorstore_cls=FAISS,
        text_splitter=RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    ).from_loaders(loaders)
    
    vector_store = index.vectorstore

# Initialize vector store on startup
initialize_vector_store()

# Define the query endpoint
@app.route('/query', methods=['POST'])
def query():
    data = request.json
    if 'question' not in data:
        return jsonify({"error": "No question found in the request"}), 400

    query = data['question']

    # Search for relevant chunks in the vector store
    results = vector_store.similarity_search(query, k=5)  # Get top 5 matches
    context = "\n".join([doc.page_content for doc in results])

    # Combine the query with retrieved context
    augmented_query = f"Context: {context}\n\nQuestion: {query}"

    # Generate response using Gemini
    try:
        response = gemini_model.generate_content(augmented_query)
        return jsonify({"response": response.text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Define the add data endpoint
@app.route('/add', methods=['POST'])
def add_data():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "No text found in the request"}), 400

    text_to_add = data['text'].strip()  # Trim whitespace
    cleaned_text = re.sub(r'[^\x20-\x7E]', '', text_to_add)  # Keep only printable ASCII characters

    if cleaned_text:
        with open('data.txt', 'a') as file:
            file.write(cleaned_text + '\n')

        # Reload the vector store with the updated data
        initialize_vector_store()

        return jsonify({"message": "Text added successfully"}), 200
    else:
        return jsonify({"error": "No valid text to add"}), 400

# Run the Flask app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

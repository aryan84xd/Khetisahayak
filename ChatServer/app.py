from flask import Flask, request, jsonify
from langchain_community.document_loaders import TextLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from ibm_watsonx_ai.foundation_models import Model
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams
from ibm_watsonx_ai.foundation_models.utils.enums import ModelTypes, DecodingMethods
import os
from dotenv import load_dotenv
from langchain_ibm import WatsonxLLM
from flask_cors import CORS 
# Initialize Flask app
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Load environment variables
load_dotenv()
watsonx_api_key = os.getenv("WATSONX_APIKEY")
print("Apikey",watsonx_api_key)
# Parameters for Watsonx LLM
parameters = {
    "decoding_method": "sample",
    "max_new_tokens": 200,
    "min_new_tokens": 1,
    "temperature": 0.5,
    "top_k": 50,
    "top_p": 1,
}

# Initialize IBM Watsonx LLM
llm = WatsonxLLM(
    model_id="meta-llama/llama-3-70b-instruct",
    url="https://eu-de.ml.cloud.ibm.com",
    project_id="07801c61-2551-43cb-ac7a-09a4d3a43c86",
    params=parameters,
)

print("Model initialized successfully")

# Load and create the index
def load_text():
    text_name = 'data.txt'
    loaders = [TextLoader(text_name)]
    
    index = VectorstoreIndexCreator(
        embedding=HuggingFaceEmbeddings(model_name='all-MiniLM-L12-v2'), 
        text_splitter=RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
    ).from_loaders(loaders)
    
    return index

index = load_text()

# Create a retrieval QA chain
chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type='stuff',
    retriever=index.vectorstore.as_retriever(),
    input_key='question'
)

# Define the API route
@app.route('/query', methods=['POST'])
def query():
    data = request.json
    if 'question' not in data:
        return jsonify({"error": "No question found in the request"}), 400

    prompt = data['question']
    response = chain.run(prompt)
    
    return jsonify({"response": response})

@app.route('/add', methods=['POST'])
def add_data():
    data = request.json
    if 'text' not in data:
        return jsonify({"error": "No text found in the request"}), 400

    # Get the text to add and clean it
    text_to_add = data['text'].strip()  # Trim whitespace

    # Remove unwanted characters (e.g., non-printable characters)
    cleaned_text = re.sub(r'[^\x20-\x7E]', '', text_to_add)  # Keep only printable ASCII characters

    # Avoid adding empty lines or unwanted content
    if cleaned_text:  # Only proceed if the cleaned text is not empty
        with open('data.txt', 'a') as file:
            file.write(cleaned_text + '\n')
        
        # Reload the index
        global index
        index = load_text()

        # Update the chain
        global chain  # Declare the chain variable as global
        chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type='stuff',
            retriever=index.vectorstore.as_retriever(),
            input_key='question'
        )
        
        return jsonify({"message": "Text added successfully"}), 200
    else:
        return jsonify({"error": "No valid text to add"}), 400

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)

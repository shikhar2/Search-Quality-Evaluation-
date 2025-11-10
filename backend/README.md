# Search Quality Evaluation System

A FastAPI-based application for evaluating query-item relevance in search systems using Google Gemini AI.

## Setup
1. **Get a Google AI API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to obtain your API key.
2. **Create a `.env` file** in the project root with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the server**:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
5. **Access the web interface** at `http://127.0.0.1:8000/static/index.html`
6. **Access API docs** at `http://127.0.0.1:8000/docs`

## Testing

### Web Interface Testing

Once the server is running, access the web interface at `http://127.0.0.1:8000/static/index.html` to test the full functionality.

#### Single Evaluation Testing

1. **Navigate to Single Evaluation Tab** (default active tab)
2. **Fill in the evaluation form**:
   - **Query**: `red running shoes`
   - **Item Title**: `Nike Air Zoom Pegasus 39`
   - **Item Description**: `Experience ultimate comfort and performance with these vibrant red running shoes. Featuring advanced Zoom Air technology for responsive cushioning, breathable mesh upper, and durable rubber outsole for excellent traction on various surfaces.`
   - **Item Category**: `Footwear`
   - **Item Attributes**: `{"color": "red", "size": "9", "brand": "Nike", "price": "$129.99"}`
3. **Click "Evaluate"** - The system will process your request and display:
   - Relevance score (1-8 scale)
   - Confidence percentage
   - Reason code
   - Color-coded results
4. **Test Copy Functionality**: Click the copy button to copy results to clipboard
5. **Test History**: Your evaluation will appear in the history panel on the right

#### Batch Evaluation Testing

1. **Switch to Batch Evaluation Tab**
2. **Click "Load Sample"** button to populate sample data, or manually enter JSON:
   ```json
   [
     {
       "query": "red running shoes",
       "item_title": "Nike Air Zoom Pegasus 39",
       "item_description": "Experience ultimate comfort and performance with these vibrant red running shoes. Featuring advanced Zoom Air technology for responsive cushioning, breathable mesh upper, and durable rubber outsole for excellent traction on various surfaces.",
       "item_category": "Footwear",
       "item_attributes": {
         "color": "red",
         "size": "9",
         "brand": "Nike",
         "price": "$129.99"
       }
     },
     {
       "query": "wireless bluetooth headphones",
       "item_title": "Sony WH-1000XM4",
       "item_description": "Premium wireless noise-canceling headphones with 30-hour battery life, quick charge, and crystal clear sound quality. Perfect for travel, work, and entertainment.",
       "item_category": "Electronics",
       "item_attributes": {
         "color": "black",
         "battery_life": "30 hours",
         "noise_cancelling": true,
         "price": "$349.99"
       }
     },
     {
       "query": "blue summer dress",
       "item_title": "Floral Maxi Dress",
       "item_description": "Elegant floor-length summer dress with beautiful blue floral patterns. Lightweight cotton fabric, perfect for beach vacations and casual outings.",
       "item_category": "Clothing",
       "item_attributes": {
         "color": "blue",
         "material": "cotton",
         "length": "maxi",
         "occasion": "casual"
       }
     }
   ]
   ```
3. **Click "Evaluate Batch"** - Process multiple evaluations simultaneously
4. **Review Results**: Each item shows score, confidence, and reason
5. **Test Filtering**:
   - Use the search box to find specific results
   - Filter by score ranges (Excellent 7-8, Good 5-6, Poor 1-4)
6. **Test Export**:
   - Click "JSON" to download results as JSON file
   - Click "CSV" to download results as CSV file
7. **Test Individual Actions**:
   - Click on any result to load it into the single evaluation form
   - Click copy buttons to copy individual results

#### Additional UI Features Testing

- **Theme Toggle**: Click the moon/sun icon to switch between light and dark modes
- **Statistics Dashboard**: View real-time evaluation statistics at the top of the page:
  - Total evaluations count with trend indicator
  - Average score with trend indicator
  - Excellent evaluations (7-8) with progress bar
  - Good evaluations (5-6) with progress bar
  - Poor evaluations (1-4) with progress bar
- **Health Status**: Check the green "Online" indicator in the navigation
- **History Panel**: View recent evaluations and click to reload them
- **Responsive Design**: Resize browser window to test mobile/tablet views

### API Testing

Test the API endpoints directly using curl or any HTTP client:

#### Single Evaluation API
```bash
curl -X POST http://127.0.0.1:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "red running shoes",
    "item_title": "Nike Air Zoom Pegasus",
    "item_description": "Comfortable running shoes in red",
    "item_category": "Footwear",
    "item_attributes": {"color": "red"}
  }'
```

#### Batch Evaluation API
```bash
curl -X POST http://127.0.0.1:8000/evaluate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "evaluations": [
      {
        "query": "red running shoes",
        "item_title": "Nike Air Zoom Pegasus",
        "item_description": "Comfortable running shoes in red",
        "item_category": "Footwear",
        "item_attributes": {"color": "red"}
      }
    ]
  }'
```

#### Health Check
```bash
curl http://127.0.0.1:8000/health
```

## Deployment to Google Cloud Platform

For production deployment, see the [GCP Deployment Guide](GCP_DEPLOYMENT_GUIDE.md) for comprehensive instructions.

### Quick Deployment

1. **Set up GCP project and enable APIs** (see deployment guide)
2. **Store your API key securely**:
   ```bash
   echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
   ```
3. **Deploy using the automated script**:
   ```bash
   ./deploy.sh your-project-id us-central1
   ```

The application will be deployed to Cloud Run with:
- Automatic scaling (0-10 instances)
- 1GB RAM, 1 CPU per instance
- 5-minute timeout for AI processing
- Secure secret management for API keys
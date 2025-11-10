# GCP Deployment Guide for Search Quality Evaluation System

This guide provides step-by-step instructions for deploying the Search Quality Evaluation System to Google Cloud Platform (GCP) using Cloud Run.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Google Cloud SDK (gcloud CLI) installed
- Docker installed locally
- Git repository access
- Google AI API key (from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Step 1: Set Up GCP Project

### 1.1 Create a New GCP Project

```bash
# Set your project ID (replace with your desired project ID)
PROJECT_ID="search-quality-eval"

# Create a new project
gcloud projects create $PROJECT_ID

# Set the project as default
gcloud config set project $PROJECT_ID
```

### 1.2 Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Container Registry API (for storing Docker images)
gcloud services enable containerregistry.googleapis.com

# Enable Secret Manager API (for storing API keys securely)
gcloud services enable secretmanager.googleapis.com
```

### 1.3 Create a Service Account (Optional but Recommended)

```bash
# Create a service account for deployment
gcloud iam service-accounts create search-quality-deployer \
    --description="Service account for deploying search quality evaluation system" \
    --display-name="Search Quality Deployer"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:search-quality-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:search-quality-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:search-quality-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Step 2: Prepare the Application for Deployment

### 2.1 Clone and Prepare the Repository

```bash
# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/search_quality_eval.git
cd search_quality_eval

# Create production requirements (add gunicorn for production)
echo "gunicorn==21.2.0" >> requirements.txt
```

### 2.2 Create Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:8000", "--workers", "2", "--worker-class", "uvicorn.workers.UvicornWorker"]
```

### 2.3 Create .dockerignore

Create a `.dockerignore` file:

```
.git
.gitignore
README.md
.env
.env.example
venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
```

### 2.4 Update main.py for Production

Update `main.py` to work better in production:

```python
# Add this import at the top
import os

# Update the app creation to be more production-ready
app = FastAPI(
    title="Search Quality Evaluation API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Update static files mounting for production
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add CORS middleware for production
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 3: Store Secrets Securely

### 3.1 Create Secret in Google Secret Manager

```bash
# Get your Google AI API key
GEMINI_API_KEY="your_actual_api_key_here"

# Create secret
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-

# Or update existing secret
echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
```

### 3.2 Grant Access to Secret

```bash
# Grant access to the service account
gcloud secrets add-iam-policy-binding gemini-api-key \
    --member="serviceAccount:search-quality-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Step 4: Build and Deploy to Cloud Run

### 4.1 Build Docker Image

```bash
# Build the Docker image
gcloud builds submit --tag gcr.io/$PROJECT_ID/search-quality-eval .

# Or build locally and push
docker build -t gcr.io/$PROJECT_ID/search-quality-eval .
docker push gcr.io/$PROJECT_ID/search-quality-eval
```

### 4.2 Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy search-quality-eval \
    --image gcr.io/$PROJECT_ID/search-quality-eval \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars "ENVIRONMENT=production" \
    --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80
```

### 4.3 Alternative: Deploy with Cloud Build

Create a `cloudbuild.yaml` file:

```yaml
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/search-quality-eval', '.']

  # Push the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/search-quality-eval']

  # Deploy to Cloud Run
  - name: 'gcr.io/google-appengine/exec-wrapper'
    args:
      - '-c'
      - |
        gcloud run deploy search-quality-eval \
          --image gcr.io/$PROJECT_ID/search-quality-eval \
          --platform managed \
          --region us-central1 \
          --allow-unauthenticated \
          --set-env-vars ENVIRONMENT=production \
          --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
          --memory 1Gi \
          --cpu 1 \
          --max-instances 10 \
          --timeout 300 \
          --concurrency 80

options:
  logging: CLOUD_LOGGING_ONLY
```

Then deploy using:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

## Step 5: Configure Custom Domain (Optional)

### 5.1 Map Custom Domain

```bash
# Add your domain
gcloud run domain-mappings create \
    --service search-quality-eval \
    --domain your-domain.com
```

### 5.2 Update DNS Records

Follow the instructions provided by the domain mapping command to update your DNS records.

## Step 6: Monitoring and Logging

### 6.1 View Logs

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=search-quality-eval" --limit 50
```

### 6.2 Set Up Monitoring

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Create dashboards for:
   - Request latency
   - Error rates
   - CPU/Memory usage
   - Request count

### 6.3 Set Up Alerts

Create alerts for:
- High error rates (>5%)
- High latency (>10 seconds)
- Service unavailability

## Step 7: Security Considerations

### 7.1 Update CORS Settings

In production, update the CORS middleware in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],  # Replace with your actual domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 7.2 Enable VPC (Optional)

For enhanced security, consider deploying with VPC:

```bash
# Create VPC network
gcloud compute networks create search-quality-vpc --subnet-mode=auto

# Deploy with VPC
gcloud run deploy search-quality-eval \
    --image gcr.io/$PROJECT_ID/search-quality-eval \
    --vpc-connector search-quality-connector \
    --allow-unauthenticated \
    # ... other options
```

## Step 8: Cost Optimization

### 8.1 Configure Autoscaling

```bash
gcloud run services update search-quality-eval \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80
```

### 8.2 Set Budget Alerts

1. Go to [Billing](https://console.cloud.google.com/billing)
2. Set up budget alerts for your project

## Step 9: Testing the Deployment

### 9.1 Test Health Endpoint

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe search-quality-eval --region=us-central1 --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health
```

### 9.2 Test API Endpoints

```bash
# Test single evaluation
curl -X POST $SERVICE_URL/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "query": "red running shoes",
    "item_title": "Nike Air Zoom Pegasus",
    "item_description": "Comfortable running shoes in red",
    "item_category": "Footwear",
    "item_attributes": {"color": "red"}
  }'
```

### 9.3 Test Web Interface

Open `$SERVICE_URL/static/index.html` in your browser to test the web interface.

## Step 10: CI/CD Setup (Optional)

### 10.1 Set Up Cloud Build Triggers

```bash
# Create a build trigger for main branch
gcloud builds triggers create github \
    --repo-name=search_quality_eval \
    --repo-owner=your-github-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml \
    --name=search-quality-deploy
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**: Ensure the secret is created and accessible
2. **Timeout Errors**: Increase the timeout in Cloud Run settings
3. **Memory Issues**: Increase memory allocation
4. **CORS Errors**: Check CORS configuration

### Useful Commands

```bash
# Check service status
gcloud run services describe search-quality-eval --region=us-central1

# View service logs
gcloud logging read "resource.type=cloud_run_revision" --filter="resource.labels.service_name=search-quality-eval" --limit 10

# Update service
gcloud run services update search-quality-eval --region=us-central1 --set-env-vars NEW_VAR=value

# Delete service
gcloud run services delete search-quality-eval --region=us-central1
```

## Cost Estimation

- **Cloud Run**: ~$0.15/hour for 1 CPU, 1GB RAM (pay per use)
- **Container Registry**: ~$0.026/GB/month for storage
- **Secret Manager**: ~$0.06/secret/month
- **Cloud Build**: Free for first 120 minutes/month

For a moderate usage application, expect ~$10-50/month depending on traffic.

## Next Steps

1. Set up monitoring dashboards
2. Configure proper logging
3. Add authentication if needed
4. Consider database integration for storing evaluation history
5. Set up automated backups if using databases

---

For additional help, refer to the [Cloud Run documentation](https://cloud.google.com/run/docs) and [FastAPI deployment guide](https://fastapi.tiangolo.com/deployment/).
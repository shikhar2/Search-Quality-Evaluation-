#!/bin/bash

# GCP Deployment Script for Search Quality Evaluation System
#
# Usage Examples:
#   ./deploy.sh                                    # Use default project "ops-excellence" and region "us-central1"
#   ./deploy.sh my-project                         # Custom project, default region
#   ./deploy.sh my-project us-west1               # Custom project and region
#   ./deploy.sh "" us-east1                       # Default project, custom region
#   ./deploy.sh ops-excellence us-central1          # Custom project and region
#
# Arguments:
#   $1 - GCP Project ID (default: "ops-excellence")
#   $2 - GCP Region (default: "us-central1")
#
# Prerequisites:
#   - Google Cloud SDK (gcloud) installed and authenticated
#   - Docker installed
#   - Google AI API key (will be prompted if secret doesn't exist)

set -e

# Configuration
PROJECT_ID=${1:-"ops-excellence"}
REGION=${2:-"us-central1"}
SERVICE_NAME="search-quality-eval"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment to GCP..."
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install Google Cloud SDK first."
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "❌ You are not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set project
echo "🔧 Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Check if GEMINI_API_KEY secret exists
if ! gcloud secrets describe gemini-api-key &> /dev/null; then
    echo "⚠️  Secret 'gemini-api-key' not found."
    read -p "Do you want to create it now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Google AI API key: " -s GEMINI_API_KEY
        echo
        echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
        echo "✅ Secret created successfully."
    else
        echo "❌ Please create the secret manually and run the script again."
        echo "Run: echo -n 'your-api-key' | gcloud secrets create gemini-api-key --data-file=-"
        exit 1
    fi
fi

# Build and push Docker image
echo "🏗️  Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "ENVIRONMENT=production" \
    --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300 \
    --concurrency 80

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🖥️  Web Interface: $SERVICE_URL/static/index.html"
echo "📚 API Docs: $SERVICE_URL/docs"
echo "💚 Health Check: $SERVICE_URL/health"

echo ""
echo "🧪 Test your deployment:"
echo "curl $SERVICE_URL/health"
echo ""
echo "📊 Monitor your service:"
echo "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/logs"
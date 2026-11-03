# Deploying to Google Cloud Run

The API runs as a **Cloud Run service**. The two daily jobs run as **Cloud Run jobs** from the
same container image, started each morning by **Cloud Scheduler**. The database stays on Neon,
and the frontend stays on Cloudflare Pages.

Commands assume a Mac or Linux terminal with the [gcloud CLI](https://cloud.google.com/sdk/docs/install)
installed. Replace `YOUR_PROJECT_ID` everywhere. Check Google's current pricing and free tier before
you start: they change.

## 1. One-time project setup

```bash
gcloud auth login
gcloud projects create YOUR_PROJECT_ID --name="Shepherds Scholar"
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region us-east4      # Virginia: close to Neon's us-east-1
```

Link a billing account in the console (Billing > Link a billing account). Cloud Run needs one even
on the free tier. Then **set a budget alert right away** (Billing > Budgets & alerts), for example
$5 with emails at 50%, 90%, and 100%. Note that a budget warns you; it does not stop spending.

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com
```

## 2. Store secrets (never in code or in the container)

Use Neon's **pooled** connection string, with `postgresql+psycopg://` at the start.

```bash
printf '%s' 'postgresql+psycopg://USER:PASSWORD@HOST-pooler.us-east-1.aws.neon.tech/shepherds_scholar?sslmode=require' \
  | gcloud secrets create DATABASE_URL --data-file=-
printf '%s' 'YOUR_API_BIBLE_KEY' | gcloud secrets create API_BIBLE_KEY --data-file=-

# Let Cloud Run's default service account read them
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
for s in DATABASE_URL API_BIBLE_KEY; do
  gcloud secrets add-iam-policy-binding $s \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role=roles/secretmanager.secretAccessor
done
```

## 3. Deploy the API

From `backend/`. `--source` builds the Dockerfile with Cloud Build and deploys it in one step.

```bash
cd backend
gcloud run deploy shepherds-scholar-api \
  --source . \
  --allow-unauthenticated \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,API_BIBLE_KEY=API_BIBLE_KEY:latest \
  --set-env-vars 'CORS_ORIGINS=["https://YOUR-SITE.pages.dev"]' \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 3 \
  --cpu-boost
```

- `--min-instances 0` keeps it free when idle; the first request after a quiet stretch waits for a
  cold start. `--min-instances 1` removes that wait but is billed while idle.
- `--max-instances 3` caps how far a traffic spike (or a bot) can run up usage.
- `--cpu-boost` gives extra CPU while the container starts, which shortens cold starts.

Check it: `curl https://<the URL gcloud printed>/api/v1/health`

## 4. Run migrations and load the Douay-Rheims (once)

Run these from your own computer against Neon (set `DATABASE_URL` in `backend/.env`):

```bash
alembic upgrade head
curl -o data/DRC.json https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/DRC.json
python -m scripts.import_douay_rheims data/DRC.json
```

## 5. The daily jobs

Create each job from the same source; only the command differs.

```bash
gcloud run jobs deploy fetch-readings --source . \
  --command python --args=-m,app.jobs.fetch_daily_readings \
  --set-secrets DATABASE_URL=DATABASE_URL:latest \
  --max-retries 1 --task-timeout 5m

gcloud run jobs deploy refresh-passages --source . \
  --command python --args=-m,app.jobs.refresh_passage_cache \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,API_BIBLE_KEY=API_BIBLE_KEY:latest \
  --max-retries 1 --task-timeout 10m

gcloud run jobs execute fetch-readings --wait     # try it once by hand
```

Schedule them with Cloud Scheduler (times in New York):

```bash
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
REGION=us-east4
for job in fetch-readings:"0 5 * * *" refresh-passages:"30 5 * * *"; do
  name=${job%%:*}; cron=${job#*:}
  gcloud scheduler jobs create http "${name}-daily" \
    --location $REGION --schedule "$cron" --time-zone America/New_York \
    --http-method POST \
    --uri "https://run.googleapis.com/v2/projects/YOUR_PROJECT_ID/locations/${REGION}/jobs/${name}:run" \
    --oauth-service-account-email "$SA"
done
```

Skip `refresh-passages` (and the `API_BIBLE_KEY` secret) until you add an API.Bible translation; the
Douay-Rheims needs no job.

## 6. Redeploying

Run the same `gcloud run deploy` command after changes. To deploy automatically on every push to
`main`, add a GitHub Actions workflow using `google-github-actions/auth` with Workload Identity
Federation (no JSON key files in GitHub) and `google-github-actions/deploy-cloudrun`.

## Where to look when something breaks

- **Logs:** Cloud Run > shepherds-scholar-api > Logs, or `gcloud run services logs read shepherds-scholar-api`
- **Job runs:** Cloud Run > Jobs > fetch-readings > Executions
- **API usage:** `SELECT * FROM external_api_usage ORDER BY day DESC;` in Neon

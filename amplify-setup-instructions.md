# AWS Amplify Setup Instructions

## Step 1: Create Amplify App
1. Go to https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Select "GitHub"
4. Choose repository: `merijnkok959595/app.screentimejourney`
5. Select branch: `main`
6. Amplify will auto-detect React settings

## Step 2: Build Settings (should auto-detect)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Step 3: Add Custom Domain
1. In Amplify app dashboard → "Domain management"
2. Click "Add domain"
3. Domain name: `screentimejourney.com`
4. Subdomain: `app`
5. Copy the CNAME value (something like: d1234567890.cloudfront.net)

## Step 4: Update DNS in Mijndomein
1. Go to your Mijndomein control panel
2. Add CNAME record:
   - Name: `app`
   - Type: `CNAME`
   - Value: [the cloudfront value from Amplify]
   - TTL: 300 (5 minutes)

## Step 5: Verify SSL Certificate
- Amplify will automatically provision SSL certificate
- Domain will be live at: https://app.screentimejourney.com

## Expected Timeline
- Build: ~5-10 minutes
- DNS propagation: ~5-15 minutes
- SSL certificate: ~15-45 minutes

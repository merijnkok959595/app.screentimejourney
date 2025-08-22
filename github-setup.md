# GitHub Setup Instructions

## Step 1: Create Repository on GitHub.com
1. Go to https://github.com/new
2. Repository name: `screen-time-dashboard`
3. Description: `Customer dashboard for Screen Time Journey Shopify app`
4. Click "Create repository"

## Step 2: Connect and Push (run these commands after creating the repo)

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/screen-time-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: After pushing, your repository URL will be:
https://github.com/YOUR_USERNAME/screen-time-dashboard

## Step 4: Use this URL in AWS Amplify
1. Go to https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Select "GitHub"
4. Choose your `screen-time-dashboard` repository
5. Select `main` branch
6. Amplify will auto-detect React settings

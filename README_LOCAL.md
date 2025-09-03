# 🚀 AWS AMPLIFY APP - PRIMARY DEPLOYMENT SOURCE

This directory contains the **PRIMARY** Amplify React app for development and deployment.

## ✅ DEPLOY FROM HERE

**This is now the main deployment source:**
- **Local Development**: Make changes here
- **AWS Amplify**: Deploy directly using AWS CLI
- **GitHub Repository**: https://github.com/merijnkok959595/app.screentimejourney (backup/reference)

## 📝 To Deploy Changes:

1. **Make changes in this directory**:
   ```bash
   cd aws_amplify_app/
   # Edit src/App.js, src/styles/brand-theme.css, etc.
   ```

2. **Build the React app**:
   ```bash
   npm run build
   ```

3. **Deploy to AWS Amplify**:
   ```bash
   aws amplify start-job --app-id d1603y70syq9xl --branch-name main --job-type RELEASE
   ```

4. **Check deployment status**:
   ```bash
   aws amplify list-jobs --app-id d1603y70syq9xl --branch-name main --max-items 3
   ```

## 🔧 This Directory Usage:

- ✅ **PRIMARY deployment source**
- ✅ Local development and testing
- ✅ Direct AWS CLI deployment
- ✅ React component development
- ⚠️ GitHub auto-deploy may not work (use manual trigger)

## 📊 Deployment Status:

- **Amplify App ID**: `d1603y70syq9xl`
- **Live URL**: `apps.screentimejourney.com`
- **Default URL**: `d1603y70syq9xl.amplifyapp.com`

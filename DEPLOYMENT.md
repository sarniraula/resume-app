# Deployment Guide: Resume Checker

This guide walks you through deploying the Resume Checker application with:
- **Backend**: AWS EC2 (Node.js + Express + Ollama)
- **Frontend**: Vercel (Vite + React)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Deployment (AWS EC2)](#backend-deployment-aws-ec2)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Post-Deployment Testing](#post-deployment-testing)
5. [Troubleshooting](#troubleshooting)
6. [Cost Estimates](#cost-estimates)

---

## Prerequisites

### Required Accounts
- **AWS Account** with billing enabled
- **Vercel Account** (free tier works)
- **Git Repository** (GitHub, GitLab, or Bitbucket)

### Local Tools
- SSH client
- Git
- Node.js 20+ (for local testing)

---

## Backend Deployment (AWS EC2)

### Step 1: Launch EC2 Instance

1. **Log into AWS Console** → Navigate to EC2 Dashboard

2. **Launch Instance**:
   - **Name**: `resume-checker-backend`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: 
     - **Recommended**: `t3.medium` (2 vCPU, 4GB RAM) - ~$30/month
     - **Budget**: `t2.micro` (1 vCPU, 1GB RAM) - Free tier, but slow with Ollama
   - **Key Pair**: Create new or use existing (download `.pem` file)
   - **Storage**: 20 GB gp3 (minimum)

3. **Configure Security Group**:
   - **SSH (22)**: Your IP only
   - **HTTP (80)**: 0.0.0.0/0 (Anywhere)
   - **HTTPS (443)**: 0.0.0.0/0 (Anywhere)
   - **Custom TCP (5001)**: 0.0.0.0/0 (for testing, remove after nginx setup)

4. **Launch Instance** and wait for it to start

5. **Note your Public IP**: You'll need this later (e.g., `54.123.45.67`)

### Step 2: Connect to EC2 Instance

```bash
# Set permissions for your key file
chmod 400 your-key.pem

# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Clone Your Repository

```bash
# Install git if not present
sudo apt update
sudo apt install -y git

# Clone your repository
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/resume-checker.git resume-checker-backend
cd resume-checker-backend/backend
```

### Step 4: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-aws.sh

# Run deployment (this takes 10-15 minutes)
./deploy-aws.sh
```

The script will:
- ✅ Install Node.js 20.x
- ✅ Install PM2 for process management
- ✅ Install Ollama
- ✅ Download Llama3 model (~4GB)
- ✅ Install nginx as reverse proxy
- ✅ Configure firewall
- ✅ Start your backend application

### Step 5: Configure Environment Variables

```bash
# Edit .env file
nano /home/ubuntu/resume-checker-backend/backend/.env
```

Update with:
```env
PORT=5001
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

**Note**: You'll update `FRONTEND_URL` after deploying to Vercel.

```bash
# Restart the application
pm2 restart resume-checker-backend
```

### Step 6: Verify Backend

```bash
# Test health endpoint
curl http://localhost/health

# Should return: {"status":"ok","timestamp":"..."}
```

From your local machine:
```bash
curl http://YOUR_EC2_PUBLIC_IP/health
```

### Step 7: (Optional) Set Up Custom Domain

If you have a domain:

1. **Point DNS A record** to your EC2 public IP
2. **Install SSL certificate**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Frontend Deployment (Vercel)

### Step 1: Push Code to Git Repository

```bash
# From your local machine
cd /path/to/resume-checker
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Update Production Environment

Edit `frontend/.env.production`:
```env
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP
```

Or if using custom domain:
```env
VITE_API_URL=https://api.yourdomain.com
```

Commit and push:
```bash
git add frontend/.env.production
git commit -m "Update production API URL"
git push origin main
```

### Step 3: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. **Import** your Git repository
4. **Configure**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**:
   - Add `VITE_API_URL` = `http://YOUR_EC2_PUBLIC_IP`
6. Click **Deploy**

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod
```

### Step 4: Update Backend CORS

After deployment, Vercel will give you a URL like `https://resume-checker-xyz.vercel.app`

SSH back into your EC2 instance:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Update .env
nano /home/ubuntu/resume-checker-backend/backend/.env
```

Add your Vercel URL:
```env
FRONTEND_URL=https://resume-checker-xyz.vercel.app
```

Restart backend:
```bash
pm2 restart resume-checker-backend
```

---

## Post-Deployment Testing

### Test Backend
```bash
# Health check
curl http://YOUR_EC2_PUBLIC_IP/health

# Test Ollama
curl -X POST http://YOUR_EC2_PUBLIC_IP/analyze \
  -F "resumeText=Software Engineer with 5 years experience" \
  -F "jdText=Looking for experienced software engineer"
```

### Test Frontend
1. Visit your Vercel URL: `https://resume-checker-xyz.vercel.app`
2. Upload a sample resume (PDF)
3. Upload a sample job description
4. Click "Analyze Match"
5. Verify results appear correctly

### Check Logs

**Backend logs**:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
pm2 logs resume-checker-backend
```

**Vercel logs**:
- Go to Vercel Dashboard → Your Project → Deployments → View Logs

---

## Troubleshooting

### Backend Issues

#### Ollama Not Running
```bash
sudo systemctl status ollama
sudo systemctl restart ollama
ollama list  # Should show llama3
```

#### PM2 Process Crashed
```bash
pm2 status
pm2 logs resume-checker-backend --lines 100
pm2 restart resume-checker-backend
```

#### CORS Errors
- Verify `FRONTEND_URL` in `.env` matches your Vercel URL exactly
- Check backend logs: `pm2 logs`
- Restart: `pm2 restart resume-checker-backend`

#### Port 80 Not Accessible
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Frontend Issues

#### API Calls Failing
- Check browser console for errors
- Verify `VITE_API_URL` environment variable in Vercel dashboard
- Test backend directly: `curl http://YOUR_EC2_IP/health`
- Redeploy frontend after fixing env vars

#### Build Failures
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Test locally: `npm run build`

### Performance Issues

#### Slow Ollama Responses
- Upgrade to larger EC2 instance (t3.medium or t3.large)
- Reduce `num_ctx` in `ollamaService.js` (currently 2048)
- Consider using a smaller model or cloud LLM API

---

## Cost Estimates

### AWS EC2
| Instance Type | vCPU | RAM | Storage | Est. Monthly Cost |
|--------------|------|-----|---------|-------------------|
| t2.micro (Free Tier) | 1 | 1GB | 20GB | $0 (first year) |
| t3.small | 2 | 2GB | 20GB | ~$15 |
| t3.medium (Recommended) | 2 | 4GB | 20GB | ~$30 |
| t3.large | 2 | 8GB | 20GB | ~$60 |

**Additional Costs**:
- Data transfer: ~$0.09/GB (first 1GB free)
- EBS storage: ~$2/month for 20GB

### Vercel
- **Free Tier**: 100GB bandwidth, unlimited deployments
- **Pro**: $20/month (if you need more)

### Total Estimated Cost
- **Minimum**: $0-5/month (using free tiers, may be slow)
- **Recommended**: $30-40/month (t3.medium + Vercel free)

---

## Useful Commands

### Backend Management
```bash
# View all PM2 processes
pm2 status

# Restart backend
pm2 restart resume-checker-backend

# View logs
pm2 logs resume-checker-backend

# Monitor resources
pm2 monit

# Stop backend
pm2 stop resume-checker-backend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Update Backend Code
```bash
cd /home/ubuntu/resume-checker-backend
git pull origin main
cd backend
npm install
pm2 restart resume-checker-backend
```

### Update Frontend
```bash
# Just push to Git, Vercel auto-deploys
git add .
git commit -m "Update frontend"
git push origin main
```

---

## Security Recommendations

1. **Restrict SSH Access**: Update security group to allow SSH only from your IP
2. **Use HTTPS**: Set up SSL certificate with Let's Encrypt
3. **Environment Variables**: Never commit `.env` files to Git
4. **Regular Updates**: Keep system packages updated
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Firewall**: UFW is enabled by deployment script
6. **Monitoring**: Set up CloudWatch alarms for CPU/memory usage

---

## Next Steps

- [ ] Set up custom domain
- [ ] Configure SSL certificate
- [ ] Set up CloudWatch monitoring
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Add rate limiting to API
- [ ] Implement user authentication (if needed)

---

**Need Help?** Check the logs first:
- Backend: `pm2 logs resume-checker-backend`
- Nginx: `sudo tail -f /var/log/nginx/error.log`
- Vercel: Dashboard → Deployments → Logs

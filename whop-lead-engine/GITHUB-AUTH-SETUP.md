# 🔑 GitHub Authentication Setup

## 🚨 Issue: Personal Access Token Required

GitHub no longer accepts passwords for git operations. You need a **Personal Access Token**.

## ✅ Quick Fix (2 minutes)

### Step 1: Create Personal Access Token
1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Set the following:
   - **Name**: `Whop Lead Engine Push`
   - **Expiration**: `90 days` (or longer)
   - **Scopes**: Check **"repo"** (this gives full repository access)
4. Click **"Generate token"**
5. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Use Token to Push
```bash
# Navigate to your project
cd /Users/advikjaiswal/whop-lead-gen/whop-lead-engine

# Push with token authentication
git push -u origin main
```

When prompted:
- **Username**: `advikjaiswal`
- **Password**: `[PASTE YOUR TOKEN HERE]`

## 🎯 Alternative: Use SSH (Recommended)

If you prefer SSH authentication:

### Set up SSH Key
```bash
# Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub
```

1. Copy the output
2. Go to: **https://github.com/settings/keys**
3. Click **"New SSH key"**
4. Paste your key and save

### Update Remote to SSH
```bash
git remote set-url origin git@github.com:advikjaiswal/whop-lead-engine.git
git push -u origin main
```

## 🚀 After Successful Push

You'll have:
- ✅ Complete SaaS codebase on GitHub
- ✅ Professional repository with documentation
- ✅ Frontend deployed on Vercel
- ✅ Ready for backend deployment

## 💰 Next Steps

1. **Deploy Backend** (Railway - 5 minutes)
2. **Get API Keys** (OpenAI, Stripe, Email)
3. **Start Selling** to Whop communities at $297/month

**You're almost there! Just get that token and push your code!** 🎯
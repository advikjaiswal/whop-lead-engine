#!/bin/bash

echo "🚀 Pushing Whop Lead Engine to GitHub"
echo "====================================="

echo "Please follow these steps:"
echo ""
echo "1. Go to https://github.com"
echo "2. Click the '+' button and create a new repository"
echo "3. Name it 'whop-lead-engine'"
echo "4. Make it Public"
echo "5. DON'T initialize with README"
echo "6. Copy the repository URL"
echo ""

read -p "Enter your GitHub username: " username

if [ -z "$username" ]; then
    echo "❌ Username is required"
    exit 1
fi

echo ""
echo "Setting up remote repository..."

# Remove existing origin
git remote remove origin 2>/dev/null

# Add new origin
git remote add origin "https://github.com/$username/whop-lead-engine.git"

echo "✅ Remote origin set to: https://github.com/$username/whop-lead-engine.git"
echo ""

echo "🚀 Pushing code to GitHub..."

# Push to GitHub
if git push -u origin main; then
    echo ""
    echo "🎉 SUCCESS! Your code has been pushed to GitHub!"
    echo ""
    echo "🌐 Repository URL: https://github.com/$username/whop-lead-engine"
    echo "📱 You can now:"
    echo "   • Share the repository link"
    echo "   • Deploy backend to Railway from GitHub"
    echo "   • Set up automated deployments"
    echo "   • Collaborate with others"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Deploy backend: https://railway.app"
    echo "   2. Get API keys (see PRODUCTION-SETUP.md)"
    echo "   3. Test the full application"
    echo "   4. Start selling to Whop communities!"
else
    echo ""
    echo "❌ Push failed. Make sure:"
    echo "   • You created the GitHub repository"
    echo "   • Repository name is exactly 'whop-lead-engine'"
    echo "   • Your GitHub credentials are set up"
    echo ""
    echo "Try running: git push -u origin main"
fi
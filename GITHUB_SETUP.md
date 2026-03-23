# GitHub Repository Setup Guide

This guide will help you set up and push this project to GitHub.

## Initial Git Setup

### 1. Initialize Git Repository (if not already initialized)

```bash
# From the project root directory
git init
```

### 2. Configure Git User (if not already configured)

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Or set globally
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Add All Files to Git

```bash
git add .
```

### 4. Create Initial Commit

```bash
git commit -m "Initial commit: School Exam Management System"
```

## GitHub Repository Setup

### 1. Create a New Repository on GitHub

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name your repository (e.g., `school-exam-management-system`)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### 2. Connect Local Repository to GitHub

```bash
# Add remote repository (replace with your GitHub username and repo name)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or if using SSH
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 3. Verify Remote Connection

```bash
git remote -v
```

### 4. Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## Important Notes

### Files That Will NOT Be Pushed

The following files are in `.gitignore` and will **NOT** be committed:

- `.env` files (contain sensitive data)
- `env.local.save` files (contain credentials)
- `node_modules/` (dependencies)
- `dist/` and `build/` (build outputs)
- IDE configuration files

### Files That WILL Be Pushed

- `.env.example` - Template for environment variables (safe to commit)
- `backend/env.example` - Backend environment template (safe to commit)
- All source code files
- `README.md` - Project documentation
- `package.json` files - Dependencies list

## After Pushing to GitHub

### For Contributors/Clone Instructions

Anyone cloning your repository should:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Set up environment variables:**
   ```bash
   # Frontend
   cp .env.example .env
   # Edit .env with your values
   
   # Backend
   cd backend
   cp env.example .env
   # Edit .env with your values
   cd ..
   ```

3. **Install dependencies:**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

4. **Set up database:**
   - Install PostgreSQL
   - Create database: `school_exam_db`
   - Update `backend/.env` with database credentials

5. **Run the application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

## Updating the Repository

### Regular Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

### Creating a New Branch

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Make changes, then commit
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push -u origin feature/new-feature
```

## Security Checklist

Before pushing, ensure:

- ✅ No `.env` files are committed (check `.gitignore`)
- ✅ No passwords or API keys in code
- ✅ `env.local.save` files are in `.gitignore`
- ✅ Only `.env.example` files are committed
- ✅ No sensitive data in commit history

## Troubleshooting

### Authentication Issues

If you get authentication errors when pushing:

```bash
# Use Personal Access Token (recommended)
# Generate token at: https://github.com/settings/tokens
# Use token as password when prompted

# Or set up SSH keys
ssh-keygen -t ed25519 -C "your.email@example.com"
# Add public key to GitHub: Settings > SSH and GPG keys
```

### Large Files

If you accidentally committed large files:

```bash
# Remove from git history (use with caution)
git rm --cached large-file.txt
git commit -m "Remove large file"
git push
```

### Undo Last Commit (Before Push)

```bash
git reset --soft HEAD~1
```

## Repository Structure on GitHub

Your repository structure should look like:

```
school-exam-management-system/
├── .env.example              ✅ Safe to commit
├── .gitignore               ✅ Safe to commit
├── README.md                ✅ Safe to commit
├── GITHUB_SETUP.md          ✅ Safe to commit
├── package.json             ✅ Safe to commit
├── backend/
│   ├── env.example          ✅ Safe to commit
│   ├── package.json         ✅ Safe to commit
│   └── src/                 ✅ Safe to commit
├── src/                     ✅ Safe to commit
└── node_modules/            ❌ Ignored (not committed)
```

---

**Ready to push!** Follow the steps above to get your repository on GitHub. 🚀



=====
git remote -v
git remote set-url origin https://github.com/kunal1274/SEMS-JNS.git
git status
git remote set-url origin git@github.com:kunal1274/SEMS-JNS.git
git push -u origin main


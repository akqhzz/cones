# Push this project to a new GitHub repo

1. **Create a new repository on GitHub**
   - Go to https://github.com/new
   - Repository name: `cones` (or any name you like)
   - Leave "Initialize with README" **unchecked**
   - Create the repository

2. **Add the remote and push** (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   cd /Users/yunjie.zhang/cones
   git remote add origin https://github.com/YOUR_USERNAME/cones.git
   git push -u origin main
   ```

   If you use SSH:

   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/cones.git
   git push -u origin main
   ```

That’s it. The repo is already initialized with an initial commit.

---
title: "Git configuration and first push"
date: 2019-05-04
---

Navigate to the local project directory and create a git repository:

```bash
git init
```

To add all files to next commit, run following:

```bash
git add .
```

To check git status, use this:

```bash
git status
```

Run command to make your first commit:

```bash
git commit -m "Your comment"
```

Setup link to your github repository and push changes:

```bash
git remote add origin <Link to GitHub Repo>     //maps the remote repo link to local git repo

git remote -v                                  //this is to verify the link to the remote repo 

git push -u origin master                      // pushes the commit-ed changes into the remote repo
```

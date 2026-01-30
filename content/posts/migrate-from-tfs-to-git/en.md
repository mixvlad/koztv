---
title: "Migrate from tfs to git"
date: 2017-05-17
---

First of all download git-tfs from there:

[http://git-tfs.com](http://git-tfs.com)

Right click on My Computer -> Properties -> Advanced system settings -> Environment variables -> System variables -> Path

Add **;C:\\TfsMigration\\GitTfs-0.25.1** to the end of Path variable.

Open Command Prompt as Administrator and exec following commands, don’t forget to change commands with your variables:

```bash
git tfs clone http://myserver:8080/tfs/DefaultCollection $/PIK.BOP/Trunk . --branches=all
```

```bash
git remote add origin http://[email protected]/apps/autobop-backend.git
```

I use **\-c http.sslVerify=false** because I have problems with my server certificate.

```bash
git -c http.sslVerify=false push --all origin
```

If your server configured properly, I recommend you to use previous command without **\-c http.sslVerify=false**:

```bash
git push --all origin
```

Full description about migrating from tfs to git you can found here:

[https://github.com/git-tfs/git-tfs/blob/master/doc/usecases/migrate\_tfs\_to\_git.md](https://github.com/git-tfs/git-tfs/blob/master/doc/usecases/migrate_tfs_to_git.md)

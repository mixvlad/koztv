---
title: "Create admin user in ubuntu linux"
date: 2017-12-04
---

1\. Login as super user:

```bash
sudo su
```

2\. Run the following command:

```bash
adduser username
```

Don’t forget to replace **username** with the name of user that you want to create.

3\. Add the user to the sudo group:

```bash
usermod -aG sudo username
```

4\. Switch to the new user:

```bash
su username
```

5\. Check that new user has admin rights:

```bash
sudo ls -la /root
```

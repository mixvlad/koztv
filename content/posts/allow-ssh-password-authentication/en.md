---
title: "Allow ssh password authentication on remote server"
date: 2017-12-04
---

1\. Connect to the server and check ssh properties:

```bash
sudo nano /etc/ssh/sshd_config
```

```ini
# Change to no to disable tunnelled clear text passwords
PasswordAuthentication yes
```

**PasswordAuthentication** should be set to **yes**.

2\. Now restart ssh service:

```bash
service ssh restart
```

3\. Try to make ssh connection with authentication by password:

```bash
ssh username@domain
```

Don’t forget to replace **username** and **domain** with your values.

[There](/create-admin-user-in-ubuntu-linux/) you can find how to create new user, if you don’t have one, for your ssh connection.

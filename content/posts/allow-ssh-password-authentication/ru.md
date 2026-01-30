---
title: "Разрешить SSH-аутентификацию по паролю на удалённом сервере"
date: 2017-12-04
---

1\. Подключитесь к серверу и проверьте настройки ssh:

```bash
sudo nano /etc/ssh/sshd_config
```

```ini
# Change to no to disable tunnelled clear text passwords
PasswordAuthentication yes
```

**PasswordAuthentication** должен быть установлен в **yes**.

2\. Теперь перезапустите службу ssh:

```bash
service ssh restart
```

3\. Попробуйте подключиться по ssh с аутентификацией по паролю:

```bash
ssh username@domain
```

Не забудьте заменить **username** и **domain** на ваши значения.

[Здесь](/create-admin-user-in-ubuntu-linux/) вы можете узнать, как создать нового пользователя, если у вас его нет, для ssh-подключения.

---
title: "Создание администратора в Ubuntu Linux"
slug: "sozdanie-administratora-v-ubuntu-linux"
date: 2017-12-04
---

1\. Войдите как суперпользователь:

```bash
sudo su
```

2\. Выполните следующую команду:

```bash
adduser username
```

Не забудьте заменить **username** на имя пользователя, которого хотите создать.

3\. Добавьте пользователя в группу sudo:

```bash
usermod -aG sudo username
```

4\. Переключитесь на нового пользователя:

```bash
su username
```

5\. Проверьте, что новый пользователь имеет права администратора:

```bash
sudo ls -la /root
```

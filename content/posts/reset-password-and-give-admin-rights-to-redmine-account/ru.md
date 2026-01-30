---
title: "Сброс пароля и выдача прав администратора для аккаунта Redmine"
slug: "sbros-parolya-i-vydacha-prav-administratora-dlya-akkaunta-re"
date: 2017-11-09
---

Сначала запустите mysql:

```sql
mysql --user=root --password=your_password
```

Параметры подключения можно найти в **{папка redmine}/htdocs/config/database**

Если учётные данные верны, вы увидите приветственное сообщение от консоли MySql:
![](../../en/reset-password-and-give-admin-rights-to-redmine-account/image1.png)

Теперь нужно посмотреть все базы данных на текущем сервере mysql, выполните эту команду:

```sql
SHOW DATABASES;
```

Вы увидите что-то похожее на это:

Нужно выбрать активную базу данных, выберите что-то со словом "redmine" в названии, у меня это "bitnami\_redmine", и выполните команду:

```sql
use your_database_name;
```

В моём случае это выглядело так:

Чтобы посмотреть информацию о текущих пользователях, можно использовать эту команду:

```sql
select * from users;
```

Затем можно сбросить пароль и любое другое свойство для любого пользователя в этой таблице. Пример с пользователем admin:

```sql
update users set hashed_password = '353e8061f2befecb6818ba0c034c632fb0bcae1b', salt ='' where login = 'admin';
```

Или можно сбросить пароль для обычного пользователя и одновременно дать ему права администратора:

```sql
update users set hashed_password = '353e8061f2befecb6818ba0c034c632fb0bcae1b', salt ='', admin = 1 where login = 'user';
```

Теперь можно войти в redmine с правами администратора, используя пароль: **password**
для аккаунта, который вы использовали на предыдущем шаге.

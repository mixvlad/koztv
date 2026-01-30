---
title: "Установка и настройка Bitnami Redmine"
date: 2016-12-13
---

Давайте избавимся от префиксов приложений, откройте файл:

```bash
nano /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
```

Закомментируйте вторую строку:

```bash
#Include "/opt/bitnami/apps/redmine/conf/httpd-prefix.conf"
```

Сохраните файл нажав **Ctrl + X**.

Откройте файл:

```bash
nano /opt/bitnami/apache2/conf/bitnami/bitnami-apps-vhosts.conf
```

Добавьте следующую строку:

```bash
Include "/opt/bitnami/apps/redmine/conf/httpd-vhosts.conf"
```

Сохраните файл нажав **Ctrl + X**.

Откройте файл:

```bash
nano /opt/bitnami/apps/redmine/conf/httpd-vhosts.conf
```

Добавьте следующий текст со своими параметрами, измените **ServerName** и **ServerAlias**:

```ini
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot "/opt/bitnami/apps/redmine/htdocs/public"

    Include "/opt/bitnami/apps/redmine/conf/httpd-app.conf"
</VirtualHost>
<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot "/opt/bitnami/apps/redmine/htdocs/public"
    SSLEngine on
    SSLCertificateFile "/opt/bitnami/apps/redmine/conf/certs/server.crt"
    SSLCertificateKeyFile "/opt/bitnami/apps/redmine/conf/certs/server.key"
    Include "/opt/bitnami/apps/redmine/conf/httpd-app.conf"
</VirtualHost>
```

Сохраните файл нажав **Ctrl + X**.

Выполните команды:

```bash
/opt/bitnami/ctlscript.sh restart apache
```

```bash
/opt/bitnami/apps/redmine/bnconfig --appurl /
```

```bash
/opt/bitnami/apps/redmine/bnconfig --disable_banner 1
```

Логин по умолчанию для MySql — "root", пароль такой же, как для администратора.

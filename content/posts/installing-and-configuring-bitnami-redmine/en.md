---
title: "Installing and configuring Bitnami Redmine"
date: 2016-12-13
---

Lets get rid of app prefixes, open file:

```bash
nano /opt/bitnami/apache2/conf/bitnami/bitnami-apps-prefix.conf
```

Comment second line, like this:

```bash
#Include "/opt/bitnami/apps/redmine/conf/httpd-prefix.conf"
```

Save file by pressing **Ctrl + X**.

Open file:

```bash
nano /opt/bitnami/apache2/conf/bitnami/bitnami-apps-vhosts.conf
```

Add following line:

```bash
Include "/opt/bitnami/apps/redmine/conf/httpd-vhosts.conf"
```

Save file by pressing **Ctrl + X**.

Open file:

```bash
nano /opt/bitnami/apps/redmine/conf/httpd-vhosts.conf
```

Add following text with your parameters, change **ServerName** and **ServerAlias**:

```ini
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot "/opt/bitnami/apps/redmine/htdocs/public"
а gth
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

Save file by pressing **Ctrl + X**.

Exec commands:

```bash
/opt/bitnami/ctlscript.sh restart apache
```

```bash
/opt/bitnami/apps/redmine/bnconfig --appurl /
```

```bash
/opt/bitnami/apps/redmine/bnconfig --disable_banner 1
```

Default login for MySql is “root” and password the same as for administrator.

---
title: "Cron-задача для обработки почты в Redmine"
date: 2017-04-16
---

Перейдите в папку redmine и скопируйте файл **use\_redmine**:

```bash
cp use_redmine proceed_mail
```

Отредактируйте новый документ:

```bash
nano ./proceed_mail
```

Замените текст на следующий (подставьте свои переменные):

```bash
#!/bin/bash

. /opt/redmine-3.3.2-2/scripts/setenv.sh

rake -f /opt/redmine-3.3.2-2/apps/redmine/htdocs/Rakefile redmine:email:receive_imap RAILS_ENV="production" host=mail_server [email protected] password=your_password move_on_success=read move_on_failure=failed
```

Чтобы открыть конфигурацию Cron, выполните команду:

```bash
crontab -e
```

Добавьте следующую строку в конец файла (подставьте свои переменные):

```bash
*/5 * * * * /opt/redmine-3.3.2-2/proceed_mail
```

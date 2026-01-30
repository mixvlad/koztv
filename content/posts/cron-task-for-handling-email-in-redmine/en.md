---
title: "Cron task for handling email in redmine"
date: 2017-04-16
---

Go to redmine folder and copy **use\_redmine** file:

```bash
cp use_redmine proceed_mail
```

Edit new document:

```bash
nano ./proceed_mail
```

Replace text with following (put your variables):

```bash
#!/bin/bash

. /opt/redmine-3.3.2-2/scripts/setenv.sh

rake -f /opt/redmine-3.3.2-2/apps/redmine/htdocs/Rakefile redmine:email:receive_imap RAILS_ENV="production" host=mail_server [email protected] password=your_password move_on_success=read move_on_failure=failed
```

To run Cron config, exec command:

```bash
crontab -e
```

Add following line to the end of the file (put your variables):

```bash
*/5 * * * * /opt/redmine-3.3.2-2/proceed_mail
```

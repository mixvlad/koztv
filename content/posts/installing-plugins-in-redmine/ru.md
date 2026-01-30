---
title: "Полезные плагины Redmine и их установка в Bitnami Redmine"
slug: "poleznye-plaginy-redmine-i-ih-ustanovka-v-bitnami-redmine"
date: 2017-01-23
---

Список плагинов:

[http://www.redmine.org/plugins/boolean\_query](http://www.redmine.org/plugins/boolean_query)

Для установки плагинов выполните следующие команды в папке htdocs redmine (у меня это "/opt/bitnami/apps/redmine/htdocs"):

```bash
bundle install
```

```bash
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

И перезапустите apache. Я использую следующую команду:

```bash
/opt/redmine-3.3.2-2/ctlscript.sh restart apache
```

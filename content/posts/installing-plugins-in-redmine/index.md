---
title: "Useful redmine plugins and how to install them in bitnami redmine"
date: 2017-01-23
---

List of plugins:

[http://www.redmine.org/plugins/boolean\_query](http://www.redmine.org/plugins/boolean_query)

To install plugins, exec following commands in redmine htdocs folder(for me it’s “/opt/bitnami/apps/redmine/htdocs”):

```bash
bundle install
```

```bash
bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

And restart apache. I use following command to do it:

```bash
/opt/redmine-3.3.2-2/ctlscript.sh restart apache
```

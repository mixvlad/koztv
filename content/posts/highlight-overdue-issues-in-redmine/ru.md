---
title: "Подсветка просроченных задач в Redmine"
slug: "podsvetka-prosrochennyh-zadach-v-redmine"
date: 2017-05-14
---

Чтобы подсветить просроченные задачи в Redmine, добавьте следующие стили в файл application.css:

```css
tr.issue.overdue td.id a, tr.issue.overdue td.subject a, .issue.overdue td.due-date { color: #f00; }
tr.private td.subject a:before {
  content: '';
  display: inline-block;
  margin: 0 3px 0 -5px;
  height: 11px;
  vertical-align: middle;
  border-left: 2px solid #d22;
  border-right: 1px solid #d22;
}
```

Оригинальная статья: [http://www.redmine.org/issues/20812](http://www.redmine.org/issues/20812)

---
title: "Highlight overdue issues in redmine"
date: 2017-05-14
---

To higlight overdue issues in redmine, add following styles to your application.css file:

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

Original article: [http://www.redmine.org/issues/20812](http://www.redmine.org/issues/20812)

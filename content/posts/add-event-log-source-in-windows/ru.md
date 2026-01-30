---
title: "Добавление источника журнала событий в Windows"
date: 2017-03-28
---

Запустите PowerShell от имени администратора и выполните следующую команду:

```powershell
New-EventLog -Source "TestApi" -LogName "Application"
```

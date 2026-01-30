---
title: "Add event log source in Windows"
date: 2017-03-28
---

Run powershell as Administrator and run following command:

```powershell
New-EventLog -Source "TestApi" -LogName "Application"
```

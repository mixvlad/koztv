---
title: "Windows App Certification Kit не работает в Windows Server 2016"
date: 2016-11-08
---

Я разрабатываю универсальные приложения Windows и обнаружил интересную проблему. Вы не можете использовать UI-версию Windows App Certification Kit, когда ваша ОС — Windows Server 2016.

Когда я попытался протестировать свою программу перед отправкой в Windows Store, я получил ошибку от Windows App Certification Kit:

![](image1.png "screenshot-2016-11-09-21-13-03")

Но мы всё ещё можем использовать консольное приложение — **appcert.exe**

Это немного сложнее, чем использовать UI-версию, нужно провести некоторую подготовку:

1\. Вам нужно установить подготовленную версию вашего приложения, она находится рядом с файлом bundle. Найдите файл с именем Add-AppDevPackage.ps и запустите его через PowerShell.

![](image2.png "screenshot-2016-11-09-21-28-57")

2\. Откройте PowerShell и выполните команду:

```powershell
Get-AppxPackage > packages.txt
```

3\. Откройте файл packages.txt и найдите своё приложение, скопируйте PackageFullName:

![](image3.png "screenshot-2016-11-09-21-41-10")

4\. Создайте файл **testPackage.bat** и поместите в него этот текст:

```batch
del %~dp0\report.xml
"C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe" reset
"C:\Program Files (x86)\Windows Kits\10\App Certification Kit\appcert.exe" test -apptype windowsstoreapp -packagefullname "Полное имя пакета вашего приложения" -reportoutputpath %~dp0\report.xml
pause
```

5\. Не забудьте заменить текст "Полное имя пакета вашего приложения" на текст из 3-го шага. Теперь вы можете запустить файл **testPackage.bat**, и когда он завершится, проверьте файл **report.xml**. Там вы найдёте всю информацию от Windows App Certification Kit о вашем приложении.

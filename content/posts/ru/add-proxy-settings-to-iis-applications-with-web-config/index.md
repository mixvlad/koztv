---
title: "Настройка прокси для IIS-приложений через web.config"
date: 2017-03-27
---

Чтобы настроить прокси для вашего IIS-приложения, добавьте следующий блок в файл web.config:

```yaml
<system.net>
    <defaultProxy>
      <proxy proxyaddress="http://192.168.0.1:8080" bypassonlocal="true" />
    </defaultProxy>
</system.net>
```

Укажите адрес вашего прокси-сервера в поле "proxyaddress".

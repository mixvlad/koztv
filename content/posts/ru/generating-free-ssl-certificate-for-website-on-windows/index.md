---
title: "Создание бесплатного SSL-сертификата для сайта на Windows"
date: 2022-09-08
---

Бесплатный сертификат можно сгенерировать здесь:

[https://zerossl.com/](https://zerossl.com/)

Если нужно конвертировать CRT в PFX, скачайте openssl отсюда:

[https://indy.fulgan.com/SSL/](https://indy.fulgan.com/SSL/)

Подойдёт что-то вроде "openssl-1.0.2q-x64\_86-win64.zip".

Если у вас отдельный crt для CA, объедините его с основным сертификатом в текстовом редакторе и назовите новый файл bundle.crt

Скопируйте все сертификаты в папку openssl. Откройте папку в терминале и выполните следующую команду:

```bash
.\openssl pkcs12 -export -out result.pfx -inkey private.key -in bundle.crt
```

Создайте пароль для нового сертификата, и если всё было сделано правильно, вы найдёте result.pfx в папке openssl.

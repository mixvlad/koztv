---
title: "Generating free ssl certificate for website on Windows"
date: 2022-09-08
---

Free certificate can be generated here:

[https://zerossl.com/](https://zerossl.com/)

If you need to convert CRT to PFX, download openssl here:

[https://indy.fulgan.com/SSL/](https://indy.fulgan.com/SSL/)

Something like “openssl-1.0.2q-x64\_86-win64.zip” will work.

If you have separate crt for CA, join it with main certificate in text editor and name new file bundle.crt

Copy all certificates to openssl folder. Open folder in terminal and run following command:

```bash
.\openssl pkcs12 -export -out result.pfx -inkey private.key -in bundle.crt
```

Create some password for your new certificate and if everything was correct, you will find result.pfx in openssl folder.

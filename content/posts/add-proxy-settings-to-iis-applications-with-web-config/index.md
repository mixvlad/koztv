---
title: "Add proxy settings to IIS Applications with web.config"
date: 2017-03-27
---

To set proxy settings for your IIS Application, just add following block to your web.config file:

```yaml
<system.net>
    <defaultProxy>
      <proxy proxyaddress="http://192.168.0.1:8080" bypassonlocal="true" />
    </defaultProxy>
</system.net>
```

Put your proxy server settings in field “proxyaddress” .

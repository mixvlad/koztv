---
title: "Настройка таймаута WebClient в PowerShell"
slug: "nastroyka-taymauta-webclient-v-powershell"
date: 2016-11-09
---

Если вы хотите настроить значение таймаута для метода downloadString класса WebClient в PowerShell, нужно расширить класс WebClient, потому что свойство Timeout не является публичным.

В следующем примере я унаследовал новый класс ExtendedWebClient от класса WebClient. И добавил публичное поле Timeout в новый класс. Затем я переопределил метод GetWebRequest для использования поля Timeout.

```powershell
$Source = @"
using System.Net;

public class ExtendedWebClient : WebClient
{
public int Timeout;

protected override WebRequest GetWebRequest(System.Uri address)
{
WebRequest request = base.GetWebRequest(address);
if (request != null)
{
request.Timeout = Timeout;
}
return request;
}

public ExtendedWebClient()
{
Timeout = 600000; // Значение таймаута по умолчанию
}
}
"@;

Add-Type -TypeDefinition $Source -Language CSharp

$webClient = New-Object ExtendedWebClient;
$webClient.Timeout = 1800000; # Изменить таймаут для webClient
$loadData = $webClient.downloadString('http://your_url')
```

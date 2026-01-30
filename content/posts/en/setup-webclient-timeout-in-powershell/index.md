---
title: "Setup WebClient timeout in PowerShell"
date: 2016-11-09
---

If you want to setup timeout value for downloadString method of WebClient Class in PowerShell, you need to extend WebClient Class, because property Timeout isn’t public.

So, in the next example I inherited new ExtendedWebClient Class from WebClient Class. And I add public field Timeout to the new class. Then I overrode GetWebRequest Method to use Timeout field.

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
Timeout = 600000; // Timeout value by default
}
}
"@;

Add-Type -TypeDefinition $Source -Language CSharp

$webClient = New-Object ExtendedWebClient;
$webClient.Timeout = 1800000; # Change timeout for webClient
$loadData = $webClient.downloadString('http://your_url')
```

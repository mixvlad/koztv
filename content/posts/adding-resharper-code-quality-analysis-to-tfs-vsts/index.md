---
title: "Adding Resharper Code Quality Analysis to TFS/VSTS"
date: 2017-12-05
---

To improve code qulaity of your project is’t good to check every build with some analyzing tool such as [Resharper Code Quality Analysis](https://marketplace.visualstudio.com/items?itemName=alanwales.resharper-code-analysis).

[Install Resharper Code Quality Analysis](https://marketplace.visualstudio.com/items?itemName=alanwales.resharper-code-analysis "Resharper Code Quality Analysis")

Now you have to add additional step to the build definition of your project after build step, like this:

![](image1.png "newStep")

Then you need to set “Path to .sln or .csproj file”, you can find it in build log in build step. Usually it something like “YourProjectName” + .sln or “YourProjectName\\YourProjectName” + .sln

![](image2.png "solutionName")

System.Management.Automation.MethodInvocationException: Exception calling “GetFullPath” with “1” argument(s): “Illegal characters in path.” —> System.ArgumentException: Illegal characters in path.

Set “Fail build severity” to “Error” if you want your build fail only in case some critical problems have found.

![](image3.png "SeverityMod")

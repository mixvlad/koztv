---
title: "Copy file to local folder from docker container"
date: 2019-08-12
---

Check containerId, by runing this command:

```powershell
sudo docker ps
```

In order to copy a file from a container to the local computer, use following command:

```powershell
docker cp :/file_path_inside_container /local_path
```

You can check full path to file inside the container with this command:

```powershell
readlink -f file.ext
```

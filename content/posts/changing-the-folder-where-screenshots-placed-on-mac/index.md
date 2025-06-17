---
title: "Changing the folder where screenshots placed on Mac"
date: 2018-02-01
---

By default all your screenshots are saving on desktop, but you can change this location to any other folder on your Mac.

First of all, start the terminal.

I personally prefer iTerm, but you can use default one that is installed on every Mac.

Choose the folder where you want to place screenshots and enter following command into terminal window:

```bash
defaults write com.apple.screencapture location
```

Now drug and drop your screenshots folder into terminal window. Then the command will look like this:

```bash
defaults write com.apple.screencapture location ~/Documents/Screenshots
```

Now you need to restart SystemUIServer, enter this command in terminal:

```bash
killall SystemUIServer
```

Thats all 😉

Take a screenshot right now with Cmd + Shift + 3 and new screenshot will be saved to the folder you chose in previous step.

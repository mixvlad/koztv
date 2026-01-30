---
title: "How to generate and copy SSH key in Mac OS"
date: 2017-07-09
---

#### Generate SSH key

First of all, open terminal window. I personally use [iTerm2](https://www.iterm2.com/).

To generate SSH keys , enter the following command in the Terminal window:

```bash
ssh-keygen -t rsa
```

You will need to answer some questions during ssh key generation process. Left destination as Default, other questions answer as you want.

#### Copy SSH key to clipboard

To copy public ssh key to clipboard, enter this command in the Terminal window:

```bash
pbcopy < ~/.ssh/id_rsa.pub
```

#### Verify SSH passphrase

To verify SSH passphrase, type:

```bash
ssh-keygen -y
```

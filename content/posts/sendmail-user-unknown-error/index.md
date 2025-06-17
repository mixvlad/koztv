---
title: "Sendmail config when MX record points to another server"
date: 2016-05-21
---

If your domain mail is hosted on mail server in a different domain, you should tell your sendmail about it. Otherwise if you try to send a mail to a user in your local domain, you will get an error from sendmail at **/vat/log/mail.log**:

**_User unknown._**

It means that sendmail is trying to find user, that is mentioned in a message, on your local server and can’t find that user, because we use mail server that is hosted on different IP-address. To solve this problem we should tell sendmail to search for mail users with our domain name on the remote server.

Open **/etc/mail/sendmail.mc** for edit:

```bash
sudo nano /etc/mail/sendmail.mc
```

Add this two lines to the end of the file:

```
define(`MAIL_HUB', `your.domain.com.')dnl
define(`LOCAL_RELAY', `your.domain.com.')dnl
```

Press “**Ctrl + X**” when you are done and answer “**Y**” for question about saving a file.

Now we should reload sendmail service:

```bash
service sendmail reload
```

And try to send mail again. If you have done everything right, emails should go through remote mail server without errors.

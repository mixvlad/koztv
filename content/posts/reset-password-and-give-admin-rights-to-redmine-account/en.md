---
title: "Reset password and give admin rights to redmine account"
date: 2017-11-09
---

First of all run mysql:

```sql
mysql --user=root --password=your_password
```

You can find your connection parameters in **{your redmine folder}/htdocs/config/database**

If credentials are correct you will see hello message from MySql console:  
![](image1.png)

Now you need to reveal all databases on current mysql server, run this command:

```sql
SHOW DATABASES;
```

You will see something like this:

We need to select active database, choose something with word “redmine” in name, for me it “bitnami\_redmine” and run command:

```sql
use your_database_name;
```

In my case it looked like this:

To reveal current users information you can use this command:

```sql
select * from users;
```

Then we can reset password and any other property for any user in this table. Example with admin user:

```sql
update users set hashed_password = '353e8061f2befecb6818ba0c034c632fb0bcae1b', salt ='' where login = 'admin';
```

Or you can reset password for regular user and make give it admin rights at the same time:

```sql
update users set hashed_password = '353e8061f2befecb6818ba0c034c632fb0bcae1b', salt ='', admin = 1 where login = 'user';
```

Now we can login to redmine with admin rights using password: **password  
**for account you used in previous step.

---
title: "MS SQL insert in the middle and reset auto increment"
date: 2019-04-28
---

In case you need to insert something in the middle and need to set autoincremented column to some particular values, you can do the following:

```sql
Set Identity_Insert [TableName] On -- Turn off identity insert for your Table
-----------------------------------
Insert TableName (pkCol, [OtherColumns])
Values(pkValue, [OtherValues])
-----------------------------------
Set Identity_Insert [TableName] Off -- Turn off identity insert for your Table
```

In case you need to reseed autoincrement in MS SQL, use this:

```sql
DBCC CHECKIDENT ([TableName], RESEED, 0) -- you will reseed [TableName] PK to start at 1
```

If you need to start not from 0 but from different number, you can change last parameter, like this:

```sql
DBCC CHECKIDENT ([TableName], RESEED, 123) -- PK will start from 124, change number if necessary
```

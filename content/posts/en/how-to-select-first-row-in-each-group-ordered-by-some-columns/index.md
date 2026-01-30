---
title: "How to select first row in each group ordered by some columns"
date: 2018-01-31
---

I’m just gonna show you an example how to select first row in each group of logins ordered by IsActive and Created columns, hope you will realise how it works.

For example i have a table:

Id | Login | IsActive | Created  
1  | test1 |     1    | 2016-01-01  
2  | test1 |     0    | 2015-05-21  
3  | test2 |     0    | 2016-07-03  
4  | test2 |     0    | 2017-01-22

I want to select only one row per login, and this login should be active, if there’s no row where some login is active, I want to select the row that was created lately. So, in my case it’s row 1 and 4.

To solve this task I created this script:

```sql
with cte as (
  select *,
  rank() over (partition by [Login] order by [Active] desc, Created desc) as [r]
  from [User]
)
SELECT * FROM cte where [r] = 1
```

With **rank() over** I sorted rows in order I needed to and saved it in column \[r\]. Then I selected only first row in each group with this:  
**SELECT \* FROM cte where \[r\] = 1**

If you need to to use it in join, just place block “with” on top, like this:

```sql
with cte as (
  select *,
  rank() over (partition by [Login] order by [Active] desc, Created desc) as [r]
  from [User]
)
SELECT * FROM Employees emp
LEFT JOIN (SELECT * FROM cte where [r] = 1) u on emp.[Login]=u.[Login]
```

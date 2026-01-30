---
title: "SQL query for today’s date minus year, month, day or minute"
date: 2018-10-09
---

To add or subtract some date/time you can use MS SQL function:

DATEADD(datepart, number, date)

Let’s say you need to add five months to current date, use this:

```sql
SELECT * FROM YourTable
WHERE YourDate < DATEADD(month, 5, GETDATE())
```

I used function GETDATE() for getting current DateTime.

If you need to subtract some time, just add minus to second param:

```sql
SELECT * FROM YourTable
WHERE YourDate < DATEADD(month, -5, GETDATE())
```

List of available arguments for datepart param:

*   year
*   quarter
*   month
*   dayofyear
*   day
*   week
*   weekday
*   hour
*   minute
*   second
*   millisecond
*   microsecond
*   nanosecond

[See full info about MS SQL function DATEADD on Microsoft website](https://docs.microsoft.com/en-us/sql/t-sql/functions/dateadd-transact-sql)

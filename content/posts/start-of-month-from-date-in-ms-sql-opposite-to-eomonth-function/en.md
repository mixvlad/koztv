---
title: "Start of month from date in MS SQL (opposite to EOMONTH function)"
date: 2016-10-08
---

Sometimes we need to select values grouped by month from MS SQL Table. Probably the easiest way to do it is to call function DateAdd with DateDiff:

```sql
SELECT Sum(YourColumn), DATEADD(month, DATEDIFF(month, 0, [YourDateColumn]), 0) as 'Date'
FROM YourTable
GROUP BY DATEADD(month, DATEDIFF(month, 0, [YourDateColumn]), 0); 
```

Or we can use EOMONTH function that give us date that is the last day of the month:

```sql
SELECT Sum(YourColumn),  EOMONTH([YourDateColumn]) as 'Date'
FROM YourTable
GROUP BY EOMONTH([YourDateColumn]) ; 
```

But usually it’s just more convenient to use first day of month. So, if you want to save your time and make you script more clear, you can create you can create your own function, just like EOMONTH:

```sql
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE FUNCTION [dbo].[SOMONTH] (@dd datetime)
   RETURNS date

AS
BEGIN
	declare @YYYY_MM_DD datetime;
	
	SET @YYYY_MM_DD = DATEADD(month, DATEDIFF(month, 0, @dd), 0);   
	
	return @YYYY_MM_DD
END	
```

Now we can call it:

```sql
SELECT Sum(YourColumn),  SOMONTH([YourDateColumn]) as 'Date'
FROM YourTable
GROUP BY SOMONTH([YourDateColumn]) ; 
```

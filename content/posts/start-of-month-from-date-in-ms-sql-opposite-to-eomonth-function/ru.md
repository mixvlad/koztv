---
title: "Начало месяца из даты в MS SQL (противоположность функции EOMONTH)"
date: 2016-10-08
---

Иногда нам нужно выбрать значения, сгруппированные по месяцам, из таблицы MS SQL. Вероятно, самый простой способ сделать это — вызвать функцию DateAdd с DateDiff:

```sql
SELECT Sum(YourColumn), DATEADD(month, DATEDIFF(month, 0, [YourDateColumn]), 0) as 'Date'
FROM YourTable
GROUP BY DATEADD(month, DATEDIFF(month, 0, [YourDateColumn]), 0);
```

Или мы можем использовать функцию EOMONTH, которая даёт нам дату последнего дня месяца:

```sql
SELECT Sum(YourColumn),  EOMONTH([YourDateColumn]) as 'Date'
FROM YourTable
GROUP BY EOMONTH([YourDateColumn]) ;
```

Но обычно удобнее использовать первый день месяца. Поэтому, если вы хотите сэкономить время и сделать скрипт более понятным, можете создать свою собственную функцию, как EOMONTH:

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

Теперь мы можем её вызвать:

```sql
SELECT Sum(YourColumn),  SOMONTH([YourDateColumn]) as 'Date'
FROM YourTable
GROUP BY SOMONTH([YourDateColumn]) ;
```

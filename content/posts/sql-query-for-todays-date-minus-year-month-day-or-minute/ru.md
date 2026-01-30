---
title: "SQL-запрос для текущей даты минус год, месяц, день или минута"
slug: "sql-zapros-dlya-tekuschey-daty-minus-god-mesyats-den-ili-min"
date: 2018-10-09
---

Чтобы добавить или вычесть дату/время, можно использовать функцию MS SQL:

DATEADD(datepart, number, date)

Допустим, вам нужно добавить пять месяцев к текущей дате, используйте это:

```sql
SELECT * FROM YourTable
WHERE YourDate < DATEADD(month, 5, GETDATE())
```

Я использовал функцию GETDATE() для получения текущей даты и времени.

Если нужно вычесть какое-то время, просто добавьте минус ко второму параметру:

```sql
SELECT * FROM YourTable
WHERE YourDate < DATEADD(month, -5, GETDATE())
```

Список доступных аргументов для параметра datepart:

*   year (год)
*   quarter (квартал)
*   month (месяц)
*   dayofyear (день года)
*   day (день)
*   week (неделя)
*   weekday (день недели)
*   hour (час)
*   minute (минута)
*   second (секунда)
*   millisecond (миллисекунда)
*   microsecond (микросекунда)
*   nanosecond (наносекунда)

[Полная информация о функции MS SQL DATEADD на сайте Microsoft](https://docs.microsoft.com/en-us/sql/t-sql/functions/dateadd-transact-sql)

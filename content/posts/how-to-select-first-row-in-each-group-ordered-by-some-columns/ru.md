---
title: "Как выбрать первую строку в каждой группе с сортировкой по столбцам"
slug: "kak-vybrat-pervuyu-stroku-v-kazhdoy-gruppe-s-sortirovkoy-po-"
date: 2018-01-31
---

Покажу пример, как выбрать первую строку в каждой группе логинов, отсортированных по столбцам IsActive и Created, надеюсь вы поймёте как это работает.

Например, у меня есть таблица:

Id | Login | IsActive | Created
1  | test1 |     1    | 2016-01-01
2  | test1 |     0    | 2015-05-21
3  | test2 |     0    | 2016-07-03
4  | test2 |     0    | 2017-01-22

Я хочу выбрать только одну строку на логин, и этот логин должен быть активным. Если нет строки, где логин активен, я хочу выбрать строку, которая была создана последней. В моём случае это строки 1 и 4.

Для решения этой задачи я создал такой скрипт:

```sql
with cte as (
  select *,
  rank() over (partition by [Login] order by [Active] desc, Created desc) as [r]
  from [User]
)
SELECT * FROM cte where [r] = 1
```

С помощью **rank() over** я отсортировал строки в нужном порядке и сохранил в столбец \[r\]. Затем выбрал только первую строку в каждой группе:
**SELECT \* FROM cte where \[r\] = 1**

Если нужно использовать в join, просто разместите блок "with" сверху:

```sql
with cte as (
  select *,
  rank() over (partition by [Login] order by [Active] desc, Created desc) as [r]
  from [User]
)
SELECT * FROM Employees emp
LEFT JOIN (SELECT * FROM cte where [r] = 1) u on emp.[Login]=u.[Login]
```

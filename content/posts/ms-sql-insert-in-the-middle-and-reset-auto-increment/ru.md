---
title: "MS SQL: вставка в середину таблицы и сброс автоинкремента"
slug: "ms-sql-vstavka-v-seredinu-tablitsy-i-sbros-avtoinkrementa"
date: 2019-04-28
---

Если вам нужно вставить что-то в середину таблицы и установить автоинкрементный столбец в определённое значение, можно сделать следующее:

```sql
Set Identity_Insert [TableName] On -- Включить вставку в identity для вашей таблицы
-----------------------------------
Insert TableName (pkCol, [OtherColumns])
Values(pkValue, [OtherValues])
-----------------------------------
Set Identity_Insert [TableName] Off -- Выключить вставку в identity для вашей таблицы
```

Если нужно сбросить автоинкремент в MS SQL, используйте это:

```sql
DBCC CHECKIDENT ([TableName], RESEED, 0) -- сбросит PK в [TableName], чтобы начинался с 1
```

Если нужно начать не с 0, а с другого числа, можно изменить последний параметр:

```sql
DBCC CHECKIDENT ([TableName], RESEED, 123) -- PK будет начинаться с 124, измените число при необходимости
```

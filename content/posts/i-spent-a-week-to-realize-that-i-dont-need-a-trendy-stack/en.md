---
title: "I spent a week to realize that I don't need a trendy stack."
date: 2026-01-20
lang: en
original_link: "https://t.me/koztv/7"
translated_from: "ru"
---

Like many, I started with Supabase as my database. Then I hit the free limits, the paid plans seemed greedy, so I decided to host everything on my own server. I spent a week on it.
In return, I got more complexity, less flexibility, and limitations that didn't suit me.
I have other projects that also need a database. But Supabase only has one. It also turned out that this beast consumes quite a few resources. In the end, I just spun up Postgres in containers on the same server where my other services live. Without unnecessary bells and whistles and without extra payments.
I should have spent more time thinking than doing. Although, honestly, I really wanted to try something new.
Every choice costs time. Make the wrong choice, and you lose time. And when you're working alone, the limit for experiments is pretty tight.
The experience was useful. But not essential.

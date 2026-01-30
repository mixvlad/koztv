---
title: "I spent a week to realize that I don't need a trendy stack."
date: 2026-01-20
lang: en
original_link: "https://t.me/koztv/7"
translated_from: "ru"
---

Like many others, I started with Supabase as a database. Then I hit the free limits, the paid plans seemed greedy, and I decided to deploy everything on my own server. It took me a week.

In return, I got more complexity, less flexibility, and limitations that didn't suit me.

I have other projects that also need a database. And Supabase has only one. It also turned out that this machine eats up resources quite a bit. In the end, I simply set up Postgres in containers on the same server where the other services live. Without extra bells and whistles and without extra payments.

I should have spent more time thinking than doing. Although, to be honest, I really wanted to try something new.

Every choice is a cost in time. Make the wrong choice, and you lose time. And when working alone, the limit on experiments is quite strict.

The experience was useful. But not mandatory.

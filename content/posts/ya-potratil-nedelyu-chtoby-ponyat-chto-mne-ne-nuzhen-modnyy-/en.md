---
title: "I spent a week to realize that I don't need a trendy stack."
date: 2026-01-20
lang: en
original_link: "https://t.me/koztv/7"
translated_from: "ru"
---

Like many, I started with Supabase as a database. Then I hit the free limits, the paid plans seemed greedy, and I decided to deploy everything on my own server. I spent a week on this.
In return, I got more complexity, less flexibility, and limitations that didn't suit me.
I have other projects, and they need a database too. But Supabase only has one. It also turned out that this beast consumes quite a few resources. In the end, I just spun up Postgres in containers on the same server where the other services live. Without extra bells and whistles and without additional payments.
I should have spent more time thinking than doing. Although, honestly, I really wanted to try something new.
Every choice is an expenditure of time. If you make the wrong choice, you lose time. And when you work alone, the limit for experiments is quite strict.
The experience was useful. But not necessary.

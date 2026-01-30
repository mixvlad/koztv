---
title: "I spent a week to understand that I don't need a trendy stack."
date: 2026-01-20
lang: en
original_link: "https://t.me/koztv/7"
translated_from: "ru"
---

Like many, I started with Supabase as a database. Then I hit the free limits, the paid ones seemed greedy, and I decided to deploy everything on my own server. I spent a week on it.

In return, I got more complexity, less flexibility, and limitations that didn't suit me.

I have other projects that also need a database. And Supabase only has one. It also turned out that this machine consumes a fair amount of resources. In the end, I simply set up Postgres in containers on the same server where the other services live. Without extra bells and whistles and without additional payments.

I should have spent more time thinking than doing. Although, to be honest, I really wanted to try something new.

Every choice is a consumption of time. Make a wrong choice, and you lose time. And when you work alone, the limit on experiments is quite strict.

The experience was useful. But not mandatory.

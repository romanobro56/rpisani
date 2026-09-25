---
layout: post
title: "On Overcoming Media Addiction"
permalink: /posts/on-overcoming-media-addiction/
---

[← Back to Home](/)

## On Overcoming Media Addiction

In attempting to overcome addiction, we commonly perceive the state of addiction as binary: either we are in a state of abusing the substance / activity which controls us or we are not. Recently I have come to understand that this is not the case for me, and I think it's unlikely that it's the case for anyone struggling with overcoming addiction either.

I will illustrate nature of my addictive tendencies stemming from social media addiction, which will help us to better understand addiction generally. My social media addiction, at the core, is the habitual and uncontrollable use of a few apps/sites that use an 'infinite scroll' mechanism. This mechanism has been shown to be extremely addictive, comparable to cigarettes or other addictive substances. Apps with infinite scroll use machine learning algorithms to identify which content on their platform, when shown to you, will keep you on the platform the longest.<sup class="note-ref"><a href="#note-1" id="ref-1" aria-label="Note 1">&#42;</a></sup> Imagine that I am going about my day when for some reason I am compelled to open an app with infinite scroll on my phone. It might be a real reason, but likely it's a reason fabricated by the reward-seeking pathways in my brain to get me back on the app. Once I'm back on the app, **somehow** I find myself on the infinite scroll tab of the app. I start scrolling for whatever reason and soon I'm stuck. I can't stop scrolling and all my time gets absorbed into this black hole in the palm of my hand. 30 minutes is on the low end of the amount of time I would scroll. Sometimes hours, even **up to 6 hours at a time** (in the worst case) I have spent scrolling. I fear for the damage that this has done to my brain already; the time when the algorithms were really gaining steam happened to line up with some of my peak developmental years, 18-21. Now you can see how critical it is for me to leave this tendency to scroll in the past.

While this scrolling habit is cumulatively the most destructive, self-sabotaging thing that I have done in my lifetime, there are plenty of other similar tendencies and habits that I carry that are no good for me. Many of these tendencies align with the same psychological needs that are being 'met' by scrolling. Recently, I have organized all the time I spend consuming media on a continuum with Instagram scrolling on one end and reading books on the other, as follows: Instagram, TikTok, YouTube (shorts), Reddit, YouTube (long-form), podcasts, internet search rabbit holes, listening to music, playing solitaire app, reading books.

<style>
  .continuum {
    --line-start: #de8680; --line-mid: #e0a650; --line-end: #6cc0a3;
    --dot-bg: #fff; --dot-bd: #8a8a8a; --scroll-dot: #de8680;
    --muted: #636363;
    margin: 1.75em 0 1.5em;
  }
  @media (prefers-color-scheme: dark) {
    .continuum {
      --line-start: #b35a54; --line-mid: #b98437; --line-end: #4e9c83;
      --dot-bg: #20212b; --dot-bd: #9a9ba3; --scroll-dot: #b35a54;
      --muted: #bbbcc3;
    }
  }
  .continuum .ends { display: flex; justify-content: space-between; font-size: 0.8em; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.6em; }
  .continuum .bracket-row, .continuum ol { display: grid; grid-template-columns: repeat(10, 1fr); }
  .continuum .bracket {
    grid-column: 1 / 5; margin: 0 1.2em 0.4em; padding-bottom: 0.15em;
    font-size: 0.8em; text-align: center; color: var(--muted);
    border: 1.5px solid var(--scroll-dot); border-bottom: 0; border-radius: 3px 3px 0 0; height: 0.5em; line-height: 0; padding-top: 0;
  }
  .continuum .bracket span { background: var(--dot-bg); padding: 0 0.4em; position: relative; top: -0.1em; }
  .continuum ol { position: relative; margin: 0; padding: 0; list-style: none; grid-template-rows: auto; }
  .continuum ol::before {
    content: ""; position: absolute; left: 0; right: 6px; top: calc(2.6em + 6px); height: 3px; margin-top: -1.5px; border-radius: 2px;
    background: linear-gradient(to right, var(--line-start), var(--line-mid), var(--line-end));
  }
  .continuum ol::after {
    content: ""; position: absolute; right: 0; top: calc(2.6em + 6px); margin-top: -6px;
    border: 6px solid transparent; border-left: 8px solid var(--line-end); border-right: 0;
  }
  .continuum li { display: grid; grid-template-rows: 2.6em 12px 2.6em; justify-items: center; margin: 0; font-size: 0.85em; line-height: 1.25; }
  .continuum .dot { grid-row: 2; width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; background: var(--dot-bg); border: 2px solid var(--dot-bd); position: relative; z-index: 1; }
  .continuum li:nth-child(-n+4) .dot { background: var(--scroll-dot); border-color: var(--scroll-dot); }
  .continuum .label { width: max-content; max-width: 7.5em; text-align: center; }
  .continuum li:nth-child(odd) .label { grid-row: 1; align-self: end; padding-bottom: 0.45em; }
  .continuum li:nth-child(even) .label { grid-row: 3; align-self: start; padding-top: 0.45em; }
  .continuum li:first-child { justify-items: start; }
  .continuum li:first-child .label { text-align: left; }
  .continuum li:last-child { justify-items: end; padding-right: 14px; }
  .continuum li:last-child .label { text-align: right; }
  @media (max-width: 600px) {
    .continuum .ends { display: none; }
    .continuum .bracket-row { display: block; position: absolute; }
    .continuum ol { display: block; padding-left: 2.2em; }
    .continuum ol::before { left: 0.55em; right: auto; top: 0.5em; bottom: 14px; width: 3px; height: auto; margin: 0 0 0 -1.5px; background: linear-gradient(to bottom, var(--line-start), var(--line-mid), var(--line-end)); }
    .continuum ol::after { left: 0.55em; right: auto; top: auto; bottom: 0; margin: 0 0 0 -6px; border: 6px solid transparent; border-top: 8px solid var(--line-end); border-bottom: 0; }
    .continuum li, .continuum li:first-child, .continuum li:last-child { display: flex; align-items: center; gap: 0.8em; height: 2em; padding: 0; margin-left: calc(-2.2em + 0.55em - 6px); font-size: 0.9em; }
    .continuum li:last-child { margin-bottom: 14px; }
    .continuum .label, .continuum li .label { max-width: none; text-align: left; padding: 0; }
    .continuum .bracket { display: none; }
    .continuum li:nth-child(4)::after { content: "↑ infinite scroll"; font-size: 0.8em; color: var(--muted); margin-left: auto; }
  }
</style>

<figure class="continuum" role="img" aria-label="A continuum of media consumption, from most to least potent: Instagram, TikTok, YouTube Shorts, Reddit (these four are infinite-scroll apps), YouTube long-form, podcasts, internet search rabbit holes, listening to music, the solitaire app, and reading books.">
  <div class="ends" aria-hidden="true"><span>Most potent</span><span>Least potent</span></div>
  <div class="bracket-row" aria-hidden="true"><div class="bracket"><span>Infinite scroll</span></div></div>
  <ol aria-hidden="true">
    <li><span class="dot"></span><span class="label">Instagram</span></li>
    <li><span class="dot"></span><span class="label">TikTok</span></li>
    <li><span class="dot"></span><span class="label">YouTube Shorts</span></li>
    <li><span class="dot"></span><span class="label">Reddit</span></li>
    <li><span class="dot"></span><span class="label">YouTube long-form</span></li>
    <li><span class="dot"></span><span class="label">Podcasts</span></li>
    <li><span class="dot"></span><span class="label">Search rabbit holes</span></li>
    <li><span class="dot"></span><span class="label">Music</span></li>
    <li><span class="dot"></span><span class="label">Solitaire</span></li>
    <li><span class="dot"></span><span class="label">Books</span></li>
  </ol>
</figure>

AI-generated graphic for readability
{: .side-note}

In addition to consuming content, I waste my time doing a whole bunch of other things when I'm bored but unable/unwilling to bring myself to work towards one of my larger goals. Sometimes I will ask AI random questions, plan moving to another country, or research buying something that I absolutely don't need. If I have a few minutes of spare time or general discomfort in sitting with my thoughts, I might check my messages, Gmail, my Robinhood portfolio, Discord, LinkedIn, etc. The goal is to cut out all of these time-wasters, so I can spend my time on things that I actually want to do. I want to cut them out for the same reasons I want to stop scrolling: I've classified them as time wasters on the basis that I'm not happy or proud of what I've accomplished when I'm done. I haven't gained any skill, or grown as a person, just moved the hands of the clock forward.<sup class="note-ref"><a href="#note-2" id="ref-2" aria-label="Note 2">&dagger;</a></sup> Here we come to the crux of the issue combating addiction. These time wasters exist in the same dimension as scrolling. 

Therefore, in the times in my life I've felt particularly empowered to take my time back, I have tried to do it **all at once**. Making the commitment to stop wasting time on social media has always entered my mind alongside the pressure to do so in all facets of my time spent online. Looking back, I can tell that the times when I've been able to go distraction-free in a matter of days are truly a testament to how powerful leaving social media is. But there's a reason I am writing this here today and it's because those times didn't last. Overcoming addiction is like peeling back the layers of your identity and your reward psychology at the same time. Quitting **everything** cold turkey is likely to turn your mental state into a fine mince and make you remember your addiction-riddled lifestyle with rose-tinted glasses.

### Stepping down the dopamine ladder

For me to overcome addiction effectively, I am doing what I would like to call 'stepping down the dopamine ladder'. It's a simple framework for carefully and consciously removing bad habits from your life without setting yourself back to square one when you inevitably falter. Remember that continuum of bad habits that I laid out earlier? We are going to cut out the worst ones step by step. Only once we've effectively stabilized our mental state without that part of our identity and the most potent dopamine source in our day to day are we going to work on removing the next one.

Here's what it looks like: I start with the infinite scroll / algorithm-driven platforms. Instagram, TikTok, YouTube shorts, and Reddit: I use an app called Freedom to restrict my usage to a window of 15 minutes a day (8:45-9:00PM).<sup class="note-ref"><a href="#note-3" id="ref-3" aria-label="Note 3">&Dagger;</a></sup> The difficulty here isn't the restriction itself, but rather restructuring my day around this constraint without regressing or quitting. The effects of this constraint on my psychology are great. I have much more time in the day that I don't exactly know what to do with, a huge dopamine deficit, and there is now something missing from my identity - that part of who I was when I was scrolling (it feels stupid to type but it's very real).

The common mistake I've made in the past is to assume that with all this extra time in my day I must immediately get to making good use of it (otherwise what am I quitting social media for?). Here I must remember that doing stuff that is good for me (gym, work, etc) also takes willpower. To immediately go from spending hours a day scrolling, which was high dopamine low willpower, to now doing what's best for me all the time, which is low dopamine high willpower, is a HUGE gap in my reward system and leap in my sense of identity.<sup class="note-ref"><a href="#note-4" id="ref-4" aria-label="Note 4">&sect;</a></sup>

Instead, we keep our sights set on that next rung of the ladder with laser focus and precision. Staying within the bounds of your new constraint is the utmost priority until it doesn't feel like a burden anymore. With time, your dopamine regulation and sense of identity will reform around what you do without scrolling in your day. A major consideration to make is that you aren't slipping into completely replacing one addiction with another. It should feel like there is a constant tension on your mind when you are quitting your addictions; this is normal and a good thing. But it should be a bearable tension, and it takes a nimble mind to differentiate what is 'slipping' and what is a normal amount of replacing a high-grade addiction with some amounts of a lower-grade one.

Here is what you should hope for when constraining the usage of your highest potency vice: the other parts of your life move in on that time with a similar, but slightly better distribution. Imagine me in the throes of social media addiction, my waking time might look something like this (for simplicity):

- 33 percent scrolling
- 33 percent schoolwork
- 14 percent miscellaneous necessary things
- 10 percent gym
- 10 percent consuming long-form content online

<style>
  .time-graph {
    --school-bg: #dbe6f6; --school-fg: #1e4a86; --school-bd: #7da2d6;
    --gym-bg: #e2efd3; --gym-fg: #3b6516; --gym-bd: #93bf6a;
    --misc-bg: #ececea; --misc-fg: #4a4a46; --misc-bd: #b0b0aa;
    --long-bg: #f8e6c8; --long-fg: #8a5409; --long-bd: #e0a650;
    --scroll-bg: #f6d5d3; --scroll-fg: #922b25; --scroll-bd: #de8680;
    --gamble-bg: #f8dccd; --gamble-fg: #963d18; --gamble-bd: #e3906b;
    --new-bg: #d3eee5; --new-fg: #1c6650; --new-bd: #6cc0a3;
    margin: 1.5em 0 1.5em;
  }
  @media (prefers-color-scheme: dark) {
    .time-graph {
      --school-bg: #1f3e70; --school-fg: #9cc0f2; --school-bd: #5c86c4;
      --gym-bg: #2f4a1a; --gym-fg: #b3dc8a; --gym-bd: #6f9a45;
      --misc-bg: #43433f; --misc-fg: #d6d6d0; --misc-bd: #85857e;
      --long-bg: #5a3c14; --long-fg: #f2bd6a; --long-bd: #b98437;
      --scroll-bg: #6a2524; --scroll-fg: #f3a39c; --scroll-bd: #b35a54;
      --gamble-bg: #683221; --gamble-fg: #f5ad8a; --gamble-bd: #b56a4b;
      --new-bg: #1c4a3e; --new-fg: #8fdcc0; --new-bd: #4e9c83;
    }
  }
  .time-graph .row { margin-bottom: 1em; }
  .time-graph .row:last-child { margin-bottom: 0; }
  .time-graph .row-title { font-weight: 600; margin-bottom: 0.35em; }
  .time-graph .bar { display: flex; height: 2.4em; border-radius: 4px; overflow: hidden; }
  .time-graph .seg {
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box; border: 1px solid; white-space: nowrap; overflow: hidden;
    font-size: 0.85em; font-variant-numeric: tabular-nums;
  }
  .time-graph .seg + .seg { border-left: 0; }
  .time-graph .school { background: var(--school-bg); color: var(--school-fg); border-color: var(--school-bd); }
  .time-graph .gym { background: var(--gym-bg); color: var(--gym-fg); border-color: var(--gym-bd); }
  .time-graph .misc { background: var(--misc-bg); color: var(--misc-fg); border-color: var(--misc-bd); }
  .time-graph .long { background: var(--long-bg); color: var(--long-fg); border-color: var(--long-bd); }
  .time-graph .scroll { background: var(--scroll-bg); color: var(--scroll-fg); border-color: var(--scroll-bd); }
  .time-graph .gamble { background: var(--gamble-bg); color: var(--gamble-fg); border-color: var(--gamble-bd); }
  .time-graph .new { background: var(--new-bg); color: var(--new-fg); border-color: var(--new-bd); }
  .time-graph .legend { display: flex; flex-wrap: wrap; gap: 0.4em 1.2em; margin: 1.2em 0 0; padding: 0; list-style: none; font-size: 0.9em; }
  .time-graph .legend li { display: flex; align-items: center; gap: 0.45em; margin: 0; }
  .time-graph .legend .swatch { width: 0.9em; height: 0.9em; border-radius: 2px; border: 1px solid; box-sizing: border-box; }
  @media (max-width: 600px) {
    .time-graph .seg .name { display: none; }
    .time-graph .seg { font-size: 0.75em; }
  }
</style>

<figure class="time-graph" role="img" aria-label="Scrolling addicted: schoolwork 33%, gym 10%, miscellaneous 14%, long-form content 10%, scrolling 33%.">
  <div class="row">
    <div class="row-title">Scrolling Addicted</div>
    <div class="bar">
      <div class="seg school" style="width:33%"><span class="name">Schoolwork&nbsp;</span>33%</div>
      <div class="seg gym" style="width:10%"><span class="name">Gym&nbsp;</span>10%</div>
      <div class="seg misc" style="width:14%"><span class="name">Misc&nbsp;</span>14%</div>
      <div class="seg long" style="width:10%">10%</div>
      <div class="seg scroll" style="width:33%"><span class="name">Scrolling&nbsp;</span>33%</div>
    </div>
  </div>
  <ul class="legend" aria-hidden="true">
    <li><span class="swatch school"></span>Schoolwork</li>
    <li><span class="swatch gym"></span>Gym</li>
    <li><span class="swatch misc"></span>Miscellaneous necessary</li>
    <li><span class="swatch long"></span>Long-form content</li>
    <li><span class="swatch scroll"></span>Scrolling (algorithm-driven)</li>
    <li><span class="swatch gamble"></span>Online gambling</li>
    <li><span class="swatch new"></span>New / better activity</li>
  </ul>
</figure>

AI-generated graphic for readability
{: .side-note}

Cutting out scrolling, a poor outcome is if the consuming long-form content online expands from 10 percent to 28 percent and the remaining 15 percent I pick up online gambling or something. This would mean I'm not really trying to make my life better but I'm quitting social media for the optics or to soothe my conscience.

<figure class="time-graph" role="img" aria-label="Cut scrolling but no progress: schoolwork 33%, gym 10%, miscellaneous 14%, long-form content 28%, online gambling 15%.">
  <div class="row">
    <div class="row-title">Cut scrolling but no progress</div>
    <div class="bar">
      <div class="seg school" style="width:33%"><span class="name">Schoolwork&nbsp;</span>33%</div>
      <div class="seg gym" style="width:10%"><span class="name">Gym&nbsp;</span>10%</div>
      <div class="seg misc" style="width:14%"><span class="name">Misc&nbsp;</span>14%</div>
      <div class="seg long" style="width:28%"><span class="name">Long-form&nbsp;</span>28%</div>
      <div class="seg gamble" style="width:15%"><span class="name">Gambling&nbsp;</span>15%</div>
    </div>
  </div>
</figure>

A careful, constant tension on my willpower could get me a new distribution that looks like this:

- 40 percent schoolwork
- 15 percent miscellaneous necessary things
- 15 percent gym
- 25 percent consuming long-form content online
- 5 percent doing something new or better with my time that I always wanted to do 

<figure class="time-graph" role="img" aria-label="Scrolling cut, effortfully: schoolwork 40%, gym 15%, miscellaneous 15%, long-form content 25%, new or better activity 5%.">
  <div class="row">
    <div class="row-title">Scrolling cut, effortfully</div>
    <div class="bar">
      <div class="seg school" style="width:40%"><span class="name">Schoolwork&nbsp;</span>40%</div>
      <div class="seg gym" style="width:15%"><span class="name">Gym&nbsp;</span>15%</div>
      <div class="seg misc" style="width:15%"><span class="name">Misc&nbsp;</span>15%</div>
      <div class="seg long" style="width:25%"><span class="name">Long-form&nbsp;</span>25%</div>
      <div class="seg new" style="width:5%">5%</div>
    </div>
  </div>
</figure>

The problem here is that you are still spending 25 percent of your time on a slightly better but similar version of your addiction. But remember where you started: 43 percent of your time (33 percent scrolling plus 10 percent long-form) went to some shit and some worse shit. Going from that to just 25 percent of your time doing some shit is a tradeoff that you should DEFINITELY make. In my experience, it isn't easy either, but it is sustainable and manageable!! Once you've spent enough time in this frame of being, your body, mind, and sense of identity adapt, and if it's still important to you to get rid of long-form content to quiet your restless mind, you can take the next step down the ladder. Here is where most people would stop, and that's okay. That's just not for me. I won't stop at cutting out doomscrolling; I'll keep working down the ladder, cutting out everything that wastes my time until I'm spending it all on things that matter to me. That same drive is what got in my way of killing the beast before, when I tried to do it all at once. This time I'm stepping down the dopamine ladder.

<hr class="notes-rule">

<sup class="note-ref"><a href="#ref-1" aria-label="Back to text">&#42;</a></sup> It's despicable how these platforms don't even have to tell you what's happening inside; every time you open Instagram/TikTok/YouTube there should be a mandatory pop-up note that says "Hello we are the smartest people in the world and we have designed this app for you to keep it open literally as long as possible, totally disregarding anything you have planned for today and for your life".
{: .side-note #note-1}

<sup class="note-ref"><a href="#ref-2" aria-label="Back to text">&dagger;</a></sup> I'm aware of the incessant need to be productive all the time fueled by the manipulative hands of capitalism, but alas, the time-waster issue is separate from this.
{: .side-note #note-2}

<sup class="note-ref"><a href="#ref-3" aria-label="Back to text">&Dagger;</a></sup> After a while I found this to be difficult to follow and unfavorable, that's why I created [Drip Screen Time](https://www.dripscreentime.app).
{: .side-note #note-3}

<sup class="note-ref"><a href="#ref-4" aria-label="Back to text">&sect;</a></sup> On identity, it really doesn't matter what you **want** to identify more with, or the person you 'feel like' when you query your conscious mind. Your identity includes layers of your subconscious which are constantly being trained on your actions throughout the day. If you spend hours a day scrolling, part of your identity is now 'scrolling addict' whether you like it or not.
{: .side-note #note-4}

AI used in the writing of this article: small structural and typographic corrections only
{: .side-note}
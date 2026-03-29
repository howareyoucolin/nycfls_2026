<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Flushing</title>
  <style>
    :root {
      --bg: #030712;
      --bg-deep: #081527;
      --cyan: #63f3ff;
      --blue: #3e7bff;
      --gold: #ffb84d;
      --white: #f7fbff;
      --soft: rgba(247, 251, 255, 0.76);
      --sky-top: #07101f;
      --sky-mid: #18345f;
      --sky-bottom: #ff914d;
      --tower-dark: #09111f;
      --tower-mid: #12243d;
      --tower-light: #1d3a5f;
      --window-warm: rgba(255, 194, 109, 0.95);
      --window-cool: rgba(109, 228, 255, 0.9);
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background: var(--bg);
    }

    body {
      position: relative;
      overflow: hidden;
      display: grid;
      place-items: center;
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Heiti SC", sans-serif;
      color: var(--white);
      background:
        radial-gradient(circle at 50% 18%, rgba(255, 230, 180, 0.28), transparent 18%),
        linear-gradient(180deg, var(--sky-top) 0%, var(--sky-mid) 56%, var(--sky-bottom) 100%);
    }

    body::before {
      position: absolute;
      inset: 0;
      content: "";
      pointer-events: none;
      background: linear-gradient(180deg, rgba(3, 7, 18, 0.08), rgba(3, 7, 18, 0.24));
      z-index: 0;
    }

    .sky,
    .sky::before,
    .sky::after,
    .city,
    .city::before,
    .city::after {
      position: absolute;
      inset: 0;
      content: "";
      pointer-events: none;
    }

    .sky {
      background:
        radial-gradient(circle at 18% 24%, rgba(99, 243, 255, 0.2), transparent 14%),
        radial-gradient(circle at 82% 18%, rgba(255, 184, 77, 0.2), transparent 16%);
    }

    .sky::before {
      background:
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.9) 0 0.12rem, transparent 0.16rem),
        radial-gradient(circle at 70% 14%, rgba(255, 255, 255, 0.7) 0 0.1rem, transparent 0.14rem),
        radial-gradient(circle at 58% 26%, rgba(255, 255, 255, 0.75) 0 0.11rem, transparent 0.15rem),
        radial-gradient(circle at 88% 32%, rgba(255, 255, 255, 0.65) 0 0.09rem, transparent 0.13rem),
        radial-gradient(circle at 12% 38%, rgba(255, 255, 255, 0.6) 0 0.1rem, transparent 0.14rem),
        radial-gradient(circle at 44% 10%, rgba(255, 255, 255, 0.72) 0 0.1rem, transparent 0.14rem);
      animation: twinkle 3s steps(2) infinite;
      opacity: 0.9;
    }

    .sky::after {
      background:
        radial-gradient(circle at 50% 22%, rgba(255, 240, 185, 0.95), rgba(255, 180, 87, 0.18) 16%, transparent 26%);
      filter: blur(24px);
      animation: sunPulse 6s ease-in-out infinite;
      opacity: 0.95;
    }

    .city {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
    }

    .city::before {
      inset: auto 0 0 0;
      height: 68vh;
      background:
        linear-gradient(180deg, transparent 0%, rgba(7, 10, 20, 0.15) 10%, rgba(4, 6, 12, 0.88) 100%),
        linear-gradient(var(--tower-light), var(--tower-light)) 0% 100% / 9% 38% no-repeat,
        linear-gradient(var(--tower-mid), var(--tower-mid)) 7% 100% / 7% 56% no-repeat,
        linear-gradient(var(--tower-dark), var(--tower-dark)) 13% 100% / 8% 44% no-repeat,
        linear-gradient(var(--tower-light), var(--tower-light)) 19% 100% / 10% 65% no-repeat,
        linear-gradient(var(--tower-dark), var(--tower-dark)) 28% 100% / 6% 52% no-repeat,
        linear-gradient(var(--tower-mid), var(--tower-mid)) 33% 100% / 8% 74% no-repeat,
        linear-gradient(var(--tower-light), var(--tower-light)) 40% 100% / 12% 46% no-repeat,
        linear-gradient(var(--tower-dark), var(--tower-dark)) 50% 100% / 7% 82% no-repeat,
        linear-gradient(var(--tower-mid), var(--tower-mid)) 56% 100% / 10% 58% no-repeat,
        linear-gradient(var(--tower-light), var(--tower-light)) 65% 100% / 8% 70% no-repeat,
        linear-gradient(var(--tower-dark), var(--tower-dark)) 72% 100% / 9% 48% no-repeat,
        linear-gradient(var(--tower-mid), var(--tower-mid)) 79% 100% / 6% 78% no-repeat,
        linear-gradient(var(--tower-light), var(--tower-light)) 84% 100% / 11% 55% no-repeat,
        linear-gradient(var(--tower-dark), var(--tower-dark)) 93% 100% / 7% 42% no-repeat;
      animation: skylineDrift 14s ease-in-out infinite alternate;
    }

    .city::after {
      inset: auto 0 0 0;
      height: 68vh;
      background:
        linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 18%, rgba(0, 0, 0, 0.82) 100%),
        linear-gradient(transparent 0 9px, rgba(255, 194, 109, 0.95) 9px 15px, transparent 15px 27px) 9% 100% / 3.2% 32% repeat-y,
        linear-gradient(transparent 0 10px, rgba(109, 228, 255, 0.85) 10px 15px, transparent 15px 28px) 21% 100% / 3.4% 44% repeat-y,
        linear-gradient(transparent 0 11px, rgba(255, 194, 109, 0.9) 11px 17px, transparent 17px 30px) 35% 100% / 3.2% 54% repeat-y,
        linear-gradient(transparent 0 10px, rgba(109, 228, 255, 0.9) 10px 15px, transparent 15px 28px) 51% 100% / 3% 62% repeat-y,
        linear-gradient(transparent 0 10px, rgba(255, 194, 109, 0.95) 10px 16px, transparent 16px 29px) 67% 100% / 3.4% 50% repeat-y,
        linear-gradient(transparent 0 10px, rgba(109, 228, 255, 0.84) 10px 15px, transparent 15px 28px) 81% 100% / 2.8% 58% repeat-y,
        linear-gradient(transparent 0 8px, rgba(255, 255, 255, 0.28) 8px 12px, transparent 12px 24px) 94% 100% / 2.4% 26% repeat-y,
        linear-gradient(90deg, transparent 0 18%, rgba(255, 255, 255, 0.07) 18% 20%, transparent 20% 100%) 0 100% / 100% 100% no-repeat;
      mix-blend-mode: screen;
      opacity: 0.9;
      animation: windowsBlink 2.4s steps(3) infinite, lightSweep 8s linear infinite;
    }

    main {
      position: relative;
      z-index: 3;
      width: 100%;
      padding: max(1.25rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right)) max(1.25rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
    }

    .panel {
      min-height: 100vh;
      min-height: 100svh;
      display: grid;
      align-items: center;
      justify-items: center;
      padding: clamp(1rem, 4vw, 2rem);
      background: transparent;
      box-shadow: none;
      text-align: center;
    }

    h1 {
      margin: 0;
      max-width: 8ch;
      padding-left: 0;
      font-size: clamp(3.5rem, 10vw, 8rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
      font-weight: 700;
      text-shadow:
        0 0 18px rgba(255, 255, 255, 0.65),
        0 0 42px rgba(99, 243, 255, 0.42),
        0 0 86px rgba(62, 123, 255, 0.35);
      animation: titleFloat 5s ease-in-out infinite;
    }

    .accent {
      display: block;
      margin-top: 0.08em;
      color: transparent;
      background: linear-gradient(90deg, #ffffff, var(--cyan), var(--gold), #ffffff, var(--cyan));
      background-size: 300% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      animation: textShine 2.2s linear infinite;
    }

    @keyframes twinkle {
      0% {
        opacity: 0.55;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 0.68;
      }
    }

    @keyframes sunPulse {
      0%, 100% {
        transform: scale(0.94);
        opacity: 0.85;
      }
      50% {
        transform: scale(1.08);
        opacity: 1;
      }
    }

    @keyframes textShine {
      0% {
        background-position: 0% 50%;
      }
      100% {
        background-position: 300% 50%;
      }
    }

    @keyframes skylineDrift {
      0% {
        transform: translateX(-1.2%);
      }
      100% {
        transform: translateX(1.2%);
      }
    }

    @keyframes windowsBlink {
      0%, 100% {
        opacity: 0.7;
      }
      50% {
        opacity: 0.98;
      }
    }

    @keyframes lightSweep {
      0% {
        transform: translateX(-10%);
        filter: brightness(0.92);
      }
      50% {
        transform: translateX(2%);
        filter: brightness(1.12);
      }
      100% {
        transform: translateX(10%);
        filter: brightness(0.92);
      }
    }

    @keyframes titleFloat {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @media (max-width: 680px) {
      body {
        background:
          radial-gradient(circle at 50% 15%, rgba(255, 230, 180, 0.32), transparent 20%),
          linear-gradient(180deg, var(--sky-top) 0%, #22416e 50%, var(--sky-bottom) 100%);
      }

      .sky::before {
        opacity: 0.72;
      }

      .sky::after {
        top: 4%;
        bottom: auto;
        height: 22vh;
      }

      .city::before,
      .city::after {
        height: 60vh;
      }

      .city::before {
        background:
          linear-gradient(180deg, transparent 0%, rgba(7, 10, 20, 0.15) 10%, rgba(4, 6, 12, 0.9) 100%),
          linear-gradient(var(--tower-light), var(--tower-light)) 0% 100% / 14% 34% no-repeat,
          linear-gradient(var(--tower-mid), var(--tower-mid)) 10% 100% / 11% 52% no-repeat,
          linear-gradient(var(--tower-dark), var(--tower-dark)) 19% 100% / 12% 40% no-repeat,
          linear-gradient(var(--tower-light), var(--tower-light)) 28% 100% / 15% 60% no-repeat,
          linear-gradient(var(--tower-dark), var(--tower-dark)) 41% 100% / 10% 48% no-repeat,
          linear-gradient(var(--tower-mid), var(--tower-mid)) 49% 100% / 12% 72% no-repeat,
          linear-gradient(var(--tower-light), var(--tower-light)) 59% 100% / 15% 44% no-repeat,
          linear-gradient(var(--tower-dark), var(--tower-dark)) 71% 100% / 11% 78% no-repeat,
          linear-gradient(var(--tower-mid), var(--tower-mid)) 80% 100% / 13% 54% no-repeat,
          linear-gradient(var(--tower-light), var(--tower-light)) 90% 100% / 10% 38% no-repeat;
      }

      .city::after {
        background:
          linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 18%, rgba(0, 0, 0, 0.84) 100%),
          linear-gradient(transparent 0 9px, rgba(255, 194, 109, 0.92) 9px 14px, transparent 14px 25px) 14% 100% / 5.2% 28% repeat-y,
          linear-gradient(transparent 0 10px, rgba(109, 228, 255, 0.84) 10px 15px, transparent 15px 26px) 32% 100% / 5.4% 40% repeat-y,
          linear-gradient(transparent 0 10px, rgba(255, 194, 109, 0.9) 10px 15px, transparent 15px 26px) 54% 100% / 5.2% 54% repeat-y,
          linear-gradient(transparent 0 10px, rgba(109, 228, 255, 0.88) 10px 15px, transparent 15px 26px) 76% 100% / 5% 58% repeat-y,
          linear-gradient(transparent 0 10px, rgba(255, 194, 109, 0.92) 10px 15px, transparent 15px 26px) 92% 100% / 4.2% 22% repeat-y;
      }

      main {
        padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
      }

      .panel {
        justify-items: center;
        align-items: start;
        padding-top: 16vh;
        padding-bottom: 28vh;
        text-align: center;
      }

      h1 {
        max-width: min(88vw, 9ch);
        padding-left: 0;
        font-size: clamp(2.8rem, 15vw, 4.8rem);
        line-height: 1.02;
        letter-spacing: -0.05em;
      }

      .accent {
        margin-top: 0.14em;
      }
    }

    @media (max-width: 420px) {
      .city::before,
      .city::after {
        height: 56vh;
      }

      .panel {
        padding-top: 14vh;
        padding-bottom: 24vh;
      }

      h1 {
        max-width: min(90vw, 9ch);
        font-size: clamp(2.35rem, 15vw, 3.8rem);
      }
    }
  </style>
</head>
<body>
  <div class="sky" aria-hidden="true"></div>
  <div class="city" aria-hidden="true"></div>

  <main>
    <section class="panel">
      <h1>
        欢迎来到
        <span class="accent">法拉盛</span>
      </h1>
    </section>
  </main>
</body>
</html>
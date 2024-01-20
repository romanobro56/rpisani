const tickers = document.querySelectorAll('technology');

tickers.forEach(ticker => {
  let tickerWidth = ticker.offsetWidth;
  let scrollAmount = 0;

  function scrollTicker() {
      scrollAmount++;
      if (scrollAmount >= tickerWidth) {
          scrollAmount = 0;
      }
      ticker.style.transform = `translateX(-${scrollAmount}px)`;
  }

  setInterval(scrollTicker, 20); // Adjust the interval for speed
});

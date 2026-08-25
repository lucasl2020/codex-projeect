(() => {
  const attributeName = "data-turnstile-probe";
  const turnstilePattern = /cf-turnstile|challenges\.cloudflare\.com\/turnstile|cf-turnstile-response/i;
  const challengePattern = /just a moment|verify you are human|checking your browser|challenge-platform/i;

  function publishState() {
    const root = document.documentElement;
    if (!root) {
      return;
    }

    const tokenInputs = Array.from(
      document.querySelectorAll('input[name="cf-turnstile-response"]')
    );
    const tokenPresent = tokenInputs.some((input) => Boolean((input.value || "").trim()));
    const bodyText = document.body ? document.body.innerText : "";
    const state = {
      url: location.href,
      title: document.title,
      widgetPresent: Boolean(document.querySelector(".cf-turnstile")) || turnstilePattern.test(document.documentElement.innerHTML),
      tokenPresent,
      challengeVisible: challengePattern.test(bodyText),
      timestamp: Date.now()
    };

    root.setAttribute(attributeName, JSON.stringify(state));
  }

  let timer = null;
  function schedulePublish() {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(publishState, 50);
  }

  publishState();
  new MutationObserver(schedulePublish).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["value", "class", "style"]
  });
  window.setInterval(publishState, 1000);
})();

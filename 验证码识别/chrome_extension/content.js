// Chrome 扩展页面探针脚本 (Content Script)
// 在所有 frame 中运行，自动嗅探并模拟通过各类验证码，提供无感一体化体验

(() => {
  let isSolving = false;

  function notifySolving() {
    try {
      chrome.runtime.sendMessage({ action: "captcha_solving" });
    } catch (e) {}
  }

  function notifyPassed() {
    try {
      chrome.runtime.sendMessage({ action: "captcha_passed" });
    } catch (e) {}
  }

  // 深度递归查找 Shadow DOM 内部元素
  function querySelectorDeep(selector, root = document) {
    if (!root) return null;
    let found = root.querySelector(selector);
    if (found) return found;

    // 遍历所有带有 shadowRoot 的子元素
    const children = root.querySelectorAll("*");
    for (const child of children) {
      if (child.shadowRoot) {
        found = querySelectorDeep(selector, child.shadowRoot);
        if (found) return found;
      }
    }
    return null;
  }

  // 模拟真实自然鼠标移动与点击（产生自然的微抖动与完整事件流）
  function simulateClick(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const jitterX = (Math.random() - 0.5) * (rect.width * 0.2);
    const jitterY = (Math.random() - 0.5) * (rect.height * 0.2);
    const clientX = rect.left + rect.width / 2 + jitterX;
    const clientY = rect.top + rect.height / 2 + jitterY;

    const events = ["mouseenter", "mouseover", "mousedown", "mouseup", "click"];
    events.forEach((type, idx) => {
      setTimeout(() => {
        const evt = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX,
          clientY,
        });
        element.dispatchEvent(evt);
      }, idx * 15);
    });
  }

  // 模拟画布上的相对坐标点击 (points 归一化为 0-1000)
  function simulateCanvasAction(canvas, kind, points) {
    const rect = canvas.getBoundingClientRect();
    if (kind === "click") {
      points.forEach(([x, y], idx) => {
        setTimeout(() => {
          const clientX = rect.left + (x * rect.width) / 1000;
          const clientY = rect.top + (y * rect.height) / 1000;
          ["mousedown", "mouseup", "click"].forEach((type) => {
            canvas.dispatchEvent(
              new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX, clientY })
            );
          });
        }, idx * 120);
      });
    } else if (kind === "drag" && points.length === 2) {
      const [start, dest] = points;
      const startX = rect.left + (start[0] * rect.width) / 1000;
      const startY = rect.top + (start[1] * rect.height) / 1000;
      const destX = rect.left + (dest[0] * rect.width) / 1000;
      const destY = rect.top + (dest[1] * rect.height) / 1000;

      canvas.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window, clientX: startX, clientY: startY }));
      const steps = 25;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const cx = startX + (destX - startX) * t;
        const cy = startY + (destY - startY) * t + Math.sin(t * Math.PI) * 2;
        canvas.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy }));
      }
      setTimeout(() => {
        canvas.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window, clientX: destX, clientY: destY }));
      }, 200);
    }
  }

  // 将 Image 转换为 Base64
  function imageToBase64(imgElement) {
    try {
      const c = document.createElement("canvas");
      c.width = imgElement.naturalWidth || imgElement.width || 120;
      c.height = imgElement.naturalHeight || imgElement.height || 120;
      const ctx = c.getContext("2d");
      ctx.drawImage(imgElement, 0, 0);
      return c.toDataURL("image/png");
    } catch (e) {
      return imgElement.src || "";
    }
  }

  // 1. Cloudflare Turnstile 自动检测与模拟点击
  function checkCloudflare(cfg) {
    if (!cfg.auto_cf) return false;
    const url = window.location.href;
    const isTurnstileHost = url.includes("challenges.cloudflare.com") || url.includes("challenge-platform");

    if (isTurnstileHost) {
      const cb = querySelectorDeep("input[type=checkbox], .ctp-checkbox-label, #challenge-stage, .ctp-checkbox-container, .cb-lb");
      if (cb && !cb.dataset.clicked) {
        cb.dataset.clicked = "true";
        notifySolving();
        console.log("[LocalCaptcha] 检测到 Cloudflare 勾选框，毫秒级模拟点击...");
        setTimeout(() => {
          simulateClick(cb);
          // 监听是否通过
          let checks = 0;
          const checkPassed = setInterval(() => {
            checks++;
            const token = document.querySelector("[name='cf-turnstile-response']")?.value;
            const checked = querySelectorDeep("input[type=checkbox]:checked, .ctp-checkbox-checked, [aria-checked='true']");
            if (token || checked) {
              clearInterval(checkPassed);
              notifyPassed();
              console.log("[LocalCaptcha] Cloudflare Turnstile 秒过成功！");
            }
            if (checks > 20) clearInterval(checkPassed);
          }, 250);
        }, 300);
        return true;
      }
    }
    return false;
  }

  // 2. Google reCAPTCHA 自动检测与求解
  function checkRecaptcha(cfg) {
    if (!cfg.auto_recaptcha) return false;
    const url = window.location.href;
    if (!url.includes("/recaptcha/api2/")) return false;

    // (A) 复选框框架 anchor (秒过无感体验)
    if (url.includes("/anchor")) {
      const anchor = document.querySelector("#recaptcha-anchor, .recaptcha-checkbox");
      if (anchor && anchor.getAttribute("aria-checked") !== "true" && !anchor.dataset.clicked) {
        anchor.dataset.clicked = "true";
        notifySolving();
        console.log("[LocalCaptcha] 检测到 Google reCAPTCHA 复选框，自动点击尝试直接免跳过...");
        setTimeout(() => {
          simulateClick(anchor);
          // 监听是否直接勾选成功 (No-CAPTCHA)
          let checks = 0;
          const checkPassed = setInterval(() => {
            checks++;
            if (anchor.getAttribute("aria-checked") === "true") {
              clearInterval(checkPassed);
              notifyPassed();
              console.log("[LocalCaptcha] Google reCAPTCHA 免挑战直接秒过！");
            }
            if (checks > 25) clearInterval(checkPassed);
          }, 200);
        }, 400);
        return true;
      }
    }

    // (B) 挑战弹窗框架 bframe (调用本地视觉模型)
    if (url.includes("/bframe") && !isSolving) {
      const promptEl = document.querySelector(".rc-imageselect-desc, .rc-imageselect-desc-no-canonical, .rc-imageselect-instructions");
      const tiles = Array.from(document.querySelectorAll("td.rc-imageselect-tile:not(.rc-imageselect-tileselected)"));
      const verifyBtn = document.querySelector("#recaptcha-verify-button");

      if (promptEl && tiles.length > 0 && verifyBtn) {
        isSolving = true;
        notifySolving();
        const promptText = promptEl.innerText.trim();
        console.log(`[LocalCaptcha] 发现 reCAPTCHA 图片挑战: '${promptText}'，调用后台离线模型...`);

        const images = tiles.map((tile) => {
          const img = tile.querySelector("img");
          return img ? imageToBase64(img) : "";
        }).filter(Boolean);

        chrome.runtime.sendMessage(
          { action: "solve_recaptcha", payload: { prompt: promptText, images } },
          (resp) => {
            isSolving = false;
            if (resp && resp.success && resp.data && Array.isArray(resp.data.selected)) {
              console.log("[LocalCaptcha] 本地模型选中格子序号:", resp.data.selected);
              resp.data.selected.forEach((idx) => {
                if (tiles[idx]) {
                  simulateClick(tiles[idx]);
                }
              });
              setTimeout(() => {
                simulateClick(verifyBtn);
                notifyPassed();
              }, 500);
            }
          }
        );
        return true;
      }
    }
    return false;
  }

  // 3. hCaptcha 自动检测与求解
  function checkHcaptcha(cfg) {
    if (!cfg.auto_hcaptcha) return false;
    const url = window.location.href;
    if (!url.includes("hcaptcha.com")) return false;

    // (A) 复选框
    const checkbox = document.querySelector("#checkbox, [aria-haspopup='true']");
    if (checkbox && !checkbox.dataset.clicked) {
      checkbox.dataset.clicked = "true";
      notifySolving();
      console.log("[LocalCaptcha] 检测到 hCaptcha 复选框，自动点击...");
      setTimeout(() => {
        simulateClick(checkbox);
        let checks = 0;
        const checkPassed = setInterval(() => {
          checks++;
          if (checkbox.getAttribute("aria-checked") === "true") {
            clearInterval(checkPassed);
            notifyPassed();
            console.log("[LocalCaptcha] hCaptcha 复选框直接秒过！");
          }
          if (checks > 20) clearInterval(checkPassed);
        }, 250);
      }, 400);
      return true;
    }

    // (B) 画布空间挑战
    const promptEl = document.querySelector(".prompt-text");
    const canvas = document.querySelector(".challenge-view canvas, canvas");
    const submitBtn = document.querySelector(".button-submit");

    if (promptEl && canvas && submitBtn && !isSolving) {
      const promptText = promptEl.innerText.trim();
      let canvasData;
      try {
        canvasData = canvas.toDataURL("image/png");
      } catch (e) {
        return false;
      }

      isSolving = true;
      notifySolving();
      console.log(`[LocalCaptcha] 发现 hCaptcha 画布挑战: '${promptText}'，本地视觉大模型计算中...`);
      chrome.runtime.sendMessage(
        { action: "solve_hcaptcha", payload: { prompt: promptText, image: canvasData } },
        (resp) => {
          isSolving = false;
          if (resp && resp.success && resp.data) {
            const { kind, points } = resp.data;
            console.log(`[LocalCaptcha] 本地模型预测动作: ${kind}, 坐标:`, points);
            simulateCanvasAction(canvas, kind, points);

            // 等待提交按钮变为“检查/验证/提交”，坚决不误点“跳过”
            let checks = 0;
            const timer = setInterval(() => {
              checks++;
              const btnText = submitBtn.innerText.trim();
              if (btnText !== "跳过" && btnText !== "Skip") {
                clearInterval(timer);
                console.log(`[LocalCaptcha] 提交按钮就绪 (${btnText})，自动提交！`);
                simulateClick(submitBtn);
                notifyPassed();
              }
              if (checks > 12) clearInterval(timer);
            }, 250);
          }
        }
      );
      return true;
    }
    return false;
  }

  // 主轮询与探测器
  function runDetector() {
    chrome.storage.local.get(["enabled", "auto_cf", "auto_recaptcha", "auto_hcaptcha"], (cfg) => {
      if (cfg.enabled === false) return;
      if (checkCloudflare(cfg)) return;
      if (checkRecaptcha(cfg)) return;
      if (checkHcaptcha(cfg)) return;
    });
  }

  // 监听 DOM 树变动实时嗅探
  const observer = new MutationObserver(() => {
    runDetector();
  });
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // 初始运行一次
  runDetector();
  setInterval(runDetector, 1500);
})();

window.onload = async function() {
  try {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(["printHtml"], resolve);
    });
    
    if (data.printHtml) {
      // Parse the stored HTML string safely
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.printHtml, "text/html");
      
      // Copy styles to the current head
      const styles = doc.querySelectorAll("style");
      styles.forEach(style => {
        document.head.appendChild(document.importNode(style, true));
      });
      
      // Copy body contents
      const bodyElements = Array.from(doc.body.childNodes);
      document.body.innerHTML = ""; // Clear "正在载入..." loader message
      bodyElements.forEach(el => {
        // Skip script tags to avoid double-execution/warnings
        if (el.tagName === "SCRIPT") return;
        document.body.appendChild(document.importNode(el, true));
      });
      
      // Trigger print after DOM is fully imported and rendered
      setTimeout(() => {
        window.print();
      }, 600);
    } else {
      document.body.innerHTML = "<div style='padding:30px;font-family:sans-serif;color:#e53e3e;text-align:center;'>❌ 未找到打印报告数据，请在侧边栏重新点击下载。</div>";
    }
  } catch (err) {
    document.body.innerHTML = `<div style='padding:30px;font-family:sans-serif;color:#e53e3e;text-align:center;'>❌ 载入出错: ${err.message}</div>`;
  }
};

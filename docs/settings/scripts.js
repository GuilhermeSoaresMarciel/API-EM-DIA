function func_setTimeout(m_timeout, m_function) {
  setTimeout(() => {
    m_function();
  }, m_timeout);
}

function showMessage(m_text) {
  const element = document.createElement("p");
  const element_style = element.style;

  element.className = "showMessage";

  element.textContent = m_text;

  element_style.animation = "animation-opacity 2s linear";

  document.body.appendChild(element);

  func_setTimeout(3000, function () {
    element.remove();
  });
}

const func_display = (id, display) => {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
};

const func_onclick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
};

window.onload = () => {
  func_display("window_debug_request_body", "flex");
  func_display("window_debug_request_headers", "none");
  func_display("window_debug_response_body", "flex");
  func_display("window_debug_response_headers", "none");

  func_onclick("btn_open_Request_Body", () => {
    func_display("window_debug_request_body", "flex");
    func_display("window_debug_request_headers", "none");
  });

  func_onclick("btn_open_Request_Headers", () => {
    func_display("window_debug_request_body", "none");
    func_display("window_debug_request_headers", "flex");
  });

  func_onclick("btn_open_Response_Body", () => {
    func_display("window_debug_response_body", "flex");
    func_display("window_debug_response_headers", "none");
  });

  func_onclick("btn_open_Response_Headers", () => {
    func_display("window_debug_response_body", "none");
    func_display("window_debug_response_headers", "flex");
  });

  func_onclick("send-btn", sendRequest);
  func_onclick("clear-btn", clearAll);
};

async function sendRequest() {
  const sendBtn = document.getElementById("send-btn");
  const method = document.getElementById("method-select").value;
  const url = document.getElementById("url-input").value;
  const bodyContent = document.getElementById("request-body").innerText;
  const headersContent = document.getElementById("request-headers").innerText;

  if (!url) {
    showMessage("Por favor, insira uma URL");
    return;
  }

  sendBtn.disabled = true;
  const originalText = sendBtn.innerText;
  sendBtn.innerText = "WAIT...";

  const startTime = performance.now();

  try {
    const options = {
      method: method,
      headers: parseHeaders(headersContent),
    };

    if (method !== "GET" && method !== "HEAD" && bodyContent) {
      options.body = bodyContent;
    }

    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const responseData = await processResponse(response, duration);
    displayResponse(responseData);
    func_display("response-section", "flex");
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    displayResponse({
      status: 0,
      statusText: "Error",
      time: duration,
      size: "0 B",
      body: `Network Error: ${error.message}`,
      headers: {},
    });
    func_display("response-section", "flex");
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerText = originalText;
  }
}

function parseHeaders(text) {
  const headers = {};
  if (!text) return headers;
  text.split("\n").forEach((line) => {
    const parts = line.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(":").trim();
      if (key) headers[key] = value;
    }
  });
  return headers;
}

async function processResponse(response, duration) {
  let bodyText = "";
  const contentType = response.headers.get("content-type");
  try {
    if (contentType && contentType.includes("application/json")) {
      const json = await response.json();
      bodyText = JSON.stringify(json, null, 2);
    } else {
      bodyText = await response.text();
    }
  } catch (e) {
    bodyText = "Parse Error";
  }

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    statusText: response.statusText,
    time: duration,
    size: formatBytes(bodyText.length),
    body: bodyText,
    headers: headers,
  };
}

function displayResponse(response) {
  const statusBadge = document.getElementById("status-badge");
  const responseTime = document.getElementById("response-time");
  const responseSize = document.getElementById("response-size");
  const responseBody = document.getElementById("response-body");
  const responseHeadersList = document.getElementById("response-headers-list");

  statusBadge.innerText = `Status: ${response.status} ${response.statusText}`;
  statusBadge.className =
    response.status >= 200 && response.status < 300
      ? "status-success"
      : "status-error";

  responseTime.innerText = `Time: ${response.time}ms`;
  responseSize.innerText = `Size: ${response.size}`;
  responseBody.innerText = response.body;

  let headersStr = "";
  Object.entries(response.headers).forEach(([key, value]) => {
    headersStr += `${key}: ${value}\n`;
  });
  responseHeadersList.innerText = headersStr || "No headers";
}

function clearAll() {
  document.getElementById("url-input").value = "";
  document.getElementById("request-body").innerText = "";
  document.getElementById("request-headers").innerText = "";
  func_display("response-section", "none");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

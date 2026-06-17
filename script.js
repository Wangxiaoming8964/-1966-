import { gameData } from "./gameData.js";

const app = document.querySelector("#app");

const state = {
  identity: null,
  questionIndex: 0,
  scores: {},
  lastFeedback: "",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(html) {
  app.innerHTML = html;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function button(label, action, extraClass = "") {
  return `<button class="btn ${extraClass}" type="button" data-action="${action}">${label}</button>`;
}

function resetState() {
  state.identity = null;
  state.questionIndex = 0;
  state.scores = {};
  state.lastFeedback = "";
}

function showHome() {
  resetState();

  render(`
    <section class="screen screen-home">
      <p class="eyebrow">历史材料互动问答</p>
      <h1>${escapeHtml(gameData.meta.title)}</h1>
      <p class="subtitle">${escapeHtml(gameData.meta.subtitle)}</p>
      <div class="actions">
        ${button("开始", "show-identities", "btn-primary")}
      </div>
    </section>
  `);
}

function showIdentities() {
  const identityButtons = gameData.identities
    .map((identity) => `
      <button class="btn btn-identity" type="button" data-action="select-identity" data-id="${escapeHtml(identity.id)}">
        <span class="identity-title">${escapeHtml(identity.buttonLabel || identity.title)}</span>
        <span class="identity-note">${escapeHtml(identity.title)}</span>
      </button>
    `)
    .join("");

  render(`
    <section class="screen">
      <div class="topline">
        <p class="eyebrow">选择身份</p>
        <p class="stamp">共 ${gameData.identities.length} 种</p>
      </div>
      <h2>你会以哪一种位置进入这段历史？</h2>
      <div class="identity-list">${identityButtons}</div>
    </section>
  `);
}

function selectIdentity(id) {
  const identity = gameData.identities.find((item) => item.id === id);
  if (!identity) return;

  state.identity = identity;
  state.questionIndex = 0;
  state.scores = Object.fromEntries(Object.keys(identity.endings).map((endingId) => [endingId, 0]));
  showIntro();
}

function showIntro() {
  render(`
    <section class="screen">
      <p class="eyebrow">身份档案</p>
      <h2>${escapeHtml(state.identity.title)}</h2>
      <div class="panel archive-card">
        <p class="intro-text">${escapeHtml(state.identity.intro)}</p>
      </div>
      <div class="actions">
        ${button("继续", "show-question", "btn-primary")}
      </div>
    </section>
  `);
}

function showQuestion() {
  const question = state.identity.questions[state.questionIndex];
  const total = state.identity.questions.length;
  const options = question.options
    .map((option, index) => `
      <button class="btn" type="button" data-action="choose-option" data-index="${index}">
        <span class="option-text">${escapeHtml(option.text)}</span>
      </button>
    `)
    .join("");

  render(`
    <section class="screen">
      <div class="topline">
        <p class="progress">第 ${state.questionIndex + 1} / ${total} 题</p>
        <p class="stamp">${escapeHtml(state.identity.buttonLabel || state.identity.title)}</p>
      </div>
      <div class="question-box">
        <h2>${escapeHtml(question.title)}</h2>
        <div class="panel">
          <p class="body-text">${escapeHtml(question.prompt)}</p>
        </div>
      </div>
      <div class="option-list">${options}</div>
    </section>
  `);
}

function chooseOption(index) {
  const question = state.identity.questions[state.questionIndex];
  const option = question.options[index];
  if (!option) return;

  Object.entries(option.effects || {}).forEach(([endingId, points]) => {
    state.scores[endingId] = (state.scores[endingId] || 0) + Number(points || 0);
  });

  state.lastFeedback = option.feedback;
  showFeedback();
}

function showFeedback() {
  const isLastQuestion = state.questionIndex >= state.identity.questions.length - 1;

  render(`
    <section class="screen">
      <p class="progress">第 ${state.questionIndex + 1} / ${state.identity.questions.length} 题</p>
      <h2>选择已记录</h2>
      <div class="panel feedback-panel">
        <p class="feedback-text">${escapeHtml(state.lastFeedback)}</p>
      </div>
      <div class="actions">
        ${button(isLastQuestion ? "查看结局" : "继续", "continue-after-feedback", "btn-primary")}
      </div>
    </section>
  `);
}

function continueAfterFeedback() {
  if (state.questionIndex >= state.identity.questions.length - 1) {
    showEnding();
    return;
  }

  state.questionIndex += 1;
  showQuestion();
}

function getWinningEnding() {
  return Object.entries(state.identity.endings)
    .map(([id, ending]) => ({
      id,
      ...ending,
      score: state.scores[id] || 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(a.priority || 999) - Number(b.priority || 999);
    })[0];
}

function showEnding() {
  const ending = getWinningEnding();

  render(`
    <section class="screen">
      <p class="eyebrow">结局档案</p>
      <h2>${escapeHtml(ending.title)}</h2>
      <div class="panel archive-card">
        <p class="ending-description">${escapeHtml(ending.description)}</p>
        <p class="ending-summary">${escapeHtml(ending.summary)}</p>
      </div>
      <div class="actions">
        ${button("重新开始", "restart", "btn-primary")}
      </div>
    </section>
  `);
}

function showLoadError(error) {
  render(`
    <section class="screen">
      <p class="eyebrow">载入失败</p>
      <h1>没有读到游戏数据</h1>
      <div class="panel error">
        <p class="body-text">请确认 index.html、script.js、style.css 和 gameData.js 在同一个文件夹内，并优先使用本地静态服务器或 GitHub Pages 打开。</p>
        <p class="body-text">${escapeHtml(error.message || error)}</p>
      </div>
    </section>
  `);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;

  if (action === "show-identities") showIdentities();
  if (action === "select-identity") selectIdentity(target.dataset.id);
  if (action === "show-question") showQuestion();
  if (action === "choose-option") chooseOption(Number(target.dataset.index));
  if (action === "continue-after-feedback") continueAfterFeedback();
  if (action === "restart") showHome();
});

try {
  showHome();
} catch (error) {
  showLoadError(error);
}

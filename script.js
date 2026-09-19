const ROUND_SECONDS = 10;
const COUNTDOWN_SECONDS = 3;
const POINTS_PER_ANSWER = 5;
const bestScoreKey = "quickMathBestScore";

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const countdownScreen = document.getElementById("countdown-screen");
const countdownNumberElement = document.getElementById("countdown-number");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const finalScoreElement = document.getElementById("final-score");
const resultMessage = document.getElementById("result-message");
const questionElement = document.getElementById("question");
const operationElement = document.getElementById("operation-tag");
const questionCountElement = document.getElementById("question-count");
const timerElement = document.getElementById("timer");
const timerBar = document.getElementById("timer-bar");
const answersElement = document.getElementById("answers");

let score = 0;
let questionNumber = 0;
let secondsLeft = ROUND_SECONDS;
let timerId;
let countdownId;
let currentQuestion;
let askedQuestions = new Set();

bestScoreElement.textContent = getBestScore();
addPrimaryPointerAction("start-button", startGame);
addPrimaryPointerAction("restart-button", startGame);
addPrimaryPointerAction("start-exit-button", exitGame);
addPrimaryPointerAction("game-over-exit-button", exitGame);

function addPrimaryPointerAction(elementId, action) {
  document.getElementById(elementId).addEventListener("pointerdown", (event) => {
    if (event.button === 0) action();
  });
}

function getBestScore() {
  return Number.parseInt(localStorage.getItem(bestScoreKey) || "0", 10);
}

function startGame() {
  score = 0;
  questionNumber = 0;
  askedQuestions = new Set();
  scoreElement.textContent = score;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  countdownScreen.classList.remove("hidden");

  let countdownSecondsLeft = COUNTDOWN_SECONDS;
  countdownNumberElement.textContent = countdownSecondsLeft;
  clearInterval(countdownId);

  countdownId = setInterval(() => {
    countdownSecondsLeft -= 1;

    if (countdownSecondsLeft <= 0) {
      clearInterval(countdownId);
      countdownScreen.classList.add("hidden");
      quizScreen.classList.remove("hidden");
      nextQuestion();
      return;
    }

    countdownNumberElement.textContent = countdownSecondsLeft;
  }, 1000);
}

function nextQuestion() {
  clearInterval(timerId);
  currentQuestion = createQuestion();
  questionNumber += 1;
  questionCountElement.textContent = `QUESTION ${String(questionNumber).padStart(2, "0")}`;
  operationElement.textContent = currentQuestion.operation;
  questionElement.textContent = `${currentQuestion.left} ${currentQuestion.symbol} ${currentQuestion.right} = ?`;
  renderAnswers(currentQuestion.options);
  startTimer();
}

function createQuestion() {
  let question;
  do {
    const operationIndex = Math.floor(Math.random() * 4);
    const operation = ["ADDITION", "SUBTRACTION", "MULTIPLICATION", "DIVISION"][operationIndex];
    let left = randomInteger(2, 20);
    let right = randomInteger(2, 12);
    let answer;

    if (operation === "ADDITION") answer = left + right;
    if (operation === "SUBTRACTION") {
      if (left < right) [left, right] = [right, left];
      answer = left - right;
    }
    if (operation === "MULTIPLICATION") answer = left * right;
    if (operation === "DIVISION") {
      answer = randomInteger(2, 12);
      right = randomInteger(2, 12);
      left = answer * right;
    }

    const symbols = { ADDITION: "+", SUBTRACTION: "−", MULTIPLICATION: "×", DIVISION: "÷" };
    const signature = `${left}${symbols[operation]}${right}`;
    question = { left, right, answer, operation, symbol: symbols[operation], signature };
  } while (askedQuestions.has(question.signature));

  askedQuestions.add(question.signature);
  question.options = createOptions(question.answer);
  return question;
}

function createOptions(answer) {
  const distractors = new Set();
  while (distractors.size < 3) {
    const offset = randomInteger(1, Math.max(4, Math.ceil(Math.abs(answer) * 0.35)));
    const distractor = Math.random() < 0.5 ? answer + offset : answer - offset;
    if (distractor >= 0 && distractor !== answer) distractors.add(distractor);
  }
  return shuffleOptions([answer, ...distractors]);
}

function shuffleOptions(options) {
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(0, index);
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  return options;
}

function renderAnswers(options) {
  answersElement.innerHTML = "";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => chooseAnswer(option));
    answersElement.appendChild(button);
  });
}

function chooseAnswer(answer) {
  if (answer !== currentQuestion.answer) {
    finishGame("wrong-answer");
    return;
  }
  score += POINTS_PER_ANSWER;
  scoreElement.textContent = score;
  nextQuestion();
}

function startTimer() {
  secondsLeft = ROUND_SECONDS;
  updateTimerDisplay();
  timerId = setInterval(() => {
    secondsLeft -= 1;
    updateTimerDisplay();
    if (secondsLeft <= 0) finishGame("timeout");
  }, 1000);
}

function updateTimerDisplay() {
  timerElement.textContent = secondsLeft;
  timerBar.style.width = `${(secondsLeft / ROUND_SECONDS) * 100}%`;
}

function finishGame(endReason) {
  clearInterval(timerId);
  const previousBest = getBestScore();
  const newBest = Math.max(previousBest, score);
  localStorage.setItem(bestScoreKey, String(newBest));
  bestScoreElement.textContent = newBest;
  finalScoreElement.textContent = score;
  resultMessage.textContent = endReason === "timeout"
    ? "NO OPTION SELECTED!"
    : score > previousBest
      ? "New high score. That was sharp."
      : `You answered ${questionNumber - 1} correctly. Try to beat ${previousBest} points.`;
  quizScreen.classList.add("hidden");
  gameOverScreen.classList.remove("hidden");
}

function exitGame() {
  clearInterval(timerId);
  clearInterval(countdownId);
  window.close();
  window.location.replace("about:blank");
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

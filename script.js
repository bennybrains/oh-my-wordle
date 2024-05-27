const ANSWER_LENGTH = 5;
const ROUNDS = 6;
const letters = document.querySelectorAll(".letterBox");
const loadingDiv = document.querySelector(".loading");
const newWordButton = document.getElementById("new-word-btn");

// I like to do an init function so I can use "await"
async function init() {
  // the state for the app
  let currentRow = 0;
  let currentGuess = "";
  let done = false;
  let isLoading = true;

  // word of the day
  let res = await fetch("https://words.dev-apis.com/word-of-the-day");
  let { word: wordRes } = await res.json();
  let word = wordRes.toUpperCase();
  let wordParts = word.split("");
  isLoading = false;
  setLoading(isLoading);

  // user adds a letter to the current guess
  function addLetter(letter) {
    if (currentGuess.length < ANSWER_LENGTH) {
      currentGuess += letter;
    } else {
      current = currentGuess.substring(0, currentGuess.length - 1) + letter;
    }

    letters[currentRow * ANSWER_LENGTH + currentGuess.length - 1].innerText =
      letter;
    letters[currentRow * ANSWER_LENGTH + currentGuess.length - 1].classList.add(
      "typing"
    );
  }

  // use tries to enter a guess
  async function commit() {
    if (currentGuess.length !== ANSWER_LENGTH) {
      // do nothing
      return;
    }

    // check the API to see if it's a valid word
    // skip this step if you're not checking for valid words
    isLoading = true;
    setLoading(isLoading);
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }),
    });
    const { validWord } = await res.json();
    isLoading = false;
    setLoading(isLoading);

    // not valid, mark the word as invalid and return
    if (!validWord) {
      markInvalidWord();
      return;
    }

    const guessParts = currentGuess.split("");
    const map = makeMap(wordParts);
    let allRight = true;

    // first pass just finds correct letters so we can mark those as
    // correct first
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // mark as correct
        letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
        map[guessParts[i]]--;
      }
    }

    // second pass finds close and wrong letters
    // we use the map to make sure we mark the correct amount of
    // close letters
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // do nothing
      } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
        // mark as close
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
        map[guessParts[i]]--;
      } else {
        // wrong
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
      }
    }

    currentRow++;
    currentGuess = "";
    if (allRight) {
      // win
      //alert("you win");
      for (let i = 0; i < ANSWER_LENGTH; i++) {
        if (guessParts[i] === wordParts[i]) {
          // mark as correct
          letters[currentRow * ANSWER_LENGTH - i].classList.add("winner");
        }
      }
      winner(word);
      done = true;
    } else if (currentRow === ROUNDS) {
      // lose
      loser(word);
      done = true;
    }
  }

  // user hits backspace, if the the length of the string is 0 then do
  // nothing
  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    letters[currentRow * ANSWER_LENGTH + currentGuess.length].innerText = "";
    letters[currentRow * ANSWER_LENGTH + currentGuess.length].classList.remove(
      "typing"
    );
  }

  // let the user know that their guess wasn't a real word
  // skip this if you're not doing guess validation
  function markInvalidWord() {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

      // long enough for the browser to repaint without the "invalid class" so we can then add it again
      setTimeout(
        () => letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid"),
        100
      );
    }
  }

  // listening for event keys and routing to the right function
  // we listen on keydown so we can catch Enter and Backspace
  document.addEventListener("keydown", function handleKeyPress(event) {
    if (done || isLoading) {
      // do nothing;
      return;
    }

    const action = event.key;

    if (action === "Enter") {
      commit();
    } else if (action === "Backspace") {
      backspace();
    } else if (isLetter(action)) {
      addLetter(action.toUpperCase());
    } else {
      // do nothing
    }
  });

  //reset and new word button
  newWordButton.addEventListener("click", async function () {
    for (let letter of letters) {
      letter.innerText = "";
      letter.classList.remove("close", "correct", "wrong", "typing");
    }
    currentRow = 0;
    currentGuess = "";
    done = false;
    isLoading = true;

    //   get new word
    res = await fetch("https://words.dev-apis.com/word-of-the-day?random=1");
    let { word: wordRes } = await res.json();
    word = wordRes.toUpperCase();
    wordParts = word.split("");
    isLoading = false;
    setLoading(isLoading);

    this.blur(); //stops the button being selected after it is pressed
  });

  //winning animation
  async function winner(word) {
    // Clear all the squares with a delay of 1500ms between each clear
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].innerText !== "") {
        await new Promise((resolve) => setTimeout(resolve, 150));
        letters[i].innerText = "";
        letters[i].classList.remove("close", "correct", "wrong", "typing");
      }
    }

    // Display "YOU" on specific squares
    const youPositions = [11, 12, 13];
    const youLetters = ["Y", "O", "U"];
    for (let i = 0; i < youPositions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = document.getElementById(`square${youPositions[i]}`);
      square.innerText = youLetters[i];
      square.classList.add("typing", "close"); // Adding 'close' class
    }

    // Display "WIN" on specific squares
    const winPositions = [16, 17, 18];
    const winLetters = ["W", "I", "N"];
    for (let i = 0; i < winPositions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = document.getElementById(`square${winPositions[i]}`);
      square.innerText = winLetters[i];
      square.classList.add("typing", "close");
    }

    // Display the winning word in the last row
    const lastRowStartingIndex = letters.length - ANSWER_LENGTH;
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = letters[lastRowStartingIndex + i];
      square.innerText = word[i];
      square.classList.add("typing", "correct");
    }
  }

  //losing animation
  async function loser(word) {
    // Clear all the squares with a delay of 150ms between each clear
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].innerText !== "") {
        await new Promise((resolve) => setTimeout(resolve, 150));
        letters[i].innerText = "";
        letters[i].classList.remove("close", "correct", "wrong", "typing");
      }
    }

    // Display "YOU" on specific squares
    const youPositions = [11, 12, 13];
    const youLetters = ["Y", "O", "U"];
    for (let i = 0; i < youPositions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = document.getElementById(`square${youPositions[i]}`);
      square.innerText = youLetters[i];
      square.classList.add("typing", "wrong");
    }

    // Display "WIN" on specific squares
    const winPositions = [16, 17, 18, 19];
    const winLetters = ["L", "O", "S", "T"];
    for (let i = 0; i < winPositions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = document.getElementById(`square${winPositions[i]}`);
      square.innerText = winLetters[i];
      square.classList.add("typing", "wrong");
    }

    // Display the winning word in the last row
    const lastRowStartingIndex = letters.length - ANSWER_LENGTH;
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const square = letters[lastRowStartingIndex + i];
      square.innerText = word[i];
      square.classList.add("typing", "correct");
    }
  }
}

// a little function to check to see if a character is alphabet letter
// this uses regex (the /[a-zA-Z]/ part) but don't worry about it
// you can learn that later and don't need it too frequently
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

// show the loading spinner when needed
function setLoading(isLoading) {
  loadingDiv.classList.toggle("hidden", !isLoading);
}

// takes an array of letters (like ['E', 'L', 'I', 'T', 'E']) and creates
// an object out of it (like {E: 2, L: 1, T: 1}) so we can use that to
// make sure we get the correct amount of letters marked close instead
// of just wrong or correct
function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}

init();

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData()
});

const timeline = [];

// TRAINING TRIALS
const trainingTrials = [
  {
    prompt: "FEK",
    promptImage: "stimuli/bear_adult_male_01.png",
    targetImage: "stimuli/bear_child_01.png"
  },
  {
    prompt: "QIK",
    promptImage: "stimuli/fox_adult_male_01.png",
    targetImage: "stimuli/fox_child_01.png"
  }
];

trainingTrials.forEach(trial => {
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Prompt:</strong> ${trial.prompt}</p>
      <img src="${trial.promptImage}" height="150"><br>
      <p>Then becomes:</p>
      <img src="${trial.targetImage}" height="150"><br>
    `,
    choices: ['Continue']
  });
});

// TEST TRIALS
const testTrials = [
  {
    promptName: "QIK",
    promptText: "Which of these is QIK?",
    choices: [
      "stimuli/fox_small.png",
      "stimuli/bear_small.png",
      "stimuli/basket_small.png",
      "stimuli/chair_small.png"
    ],
    correct: "stimuli/bear_small.png"
  },
  {
    promptName: "WUN",
    promptText: "Which of these is WUN?",
    choices: [
      "stimuli/bokchoy_small.png",
      "stimuli/asteroid_small.png",
      "stimuli/basket_small.png",
      "stimuli/chair_small.png"
    ],
    correct: "stimuli/bokchoy_small.png"
  }
];

testTrials.forEach(trial => {
  timeline.push({
    type: jsPsychImageButtonResponse,
    stimulus: `<p>${trial.promptText}</p><p><strong>${trial.promptName}</strong></p>`,
    choices: trial.choices,
    data: { correct_choice: trial.correct },
    on_finish: function(data) {
      data.correct = trial.choices[data.response] === trial.correct;
    }
  });
});

// START EXPERIMENT
jsPsych.run(timeline);



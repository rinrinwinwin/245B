// Initialize jsPsych instance (MUST do this first in v7+)
const jsPsych = initJsPsych({
  on_finish: function() {
    jsPsych.data.displayData();
  }
});

const timeline = [];

// TRAINING TRIALS
const trainingTrials = [
  {
    prompt: "FEK",
    promptImage: "stimuli/bear_adult_male_01.png",
  },
  {
    prompt: "QIK",
    promptImage: "stimuli/fox_adult_male_01.png",
  }
];

trainingTrials.forEach(trial => {
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <p><strong>Prompt:</strong> ${trial.prompt}</p>
      <img src="${trial.promptImage}" height="150"><br>
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
  const imageChoices = trial.choices.map(path => `<img src="${path}" height="100">`);

  timeline.push({
    type: jsPsychImageButtonResponse,
    stimulus: `<p>${trial.promptText}</p><p><strong>${trial.promptName}</strong></p>`,
    choices: imageChoices,
    button_html: '<button class="jspsych-btn">%choice%</button>',
    data: {
      prompt_name: trial.promptName,
      correct_path: trial.correct
    },
    on_finish: function(data) {
      const selectedPath = trial.choices[data.response];
      data.selected_path = selectedPath;
      data.correct = selectedPath === trial.correct;
    }
  });
});

// Start the experiment
jsPsych.run(timeline);




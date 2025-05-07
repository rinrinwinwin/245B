// Initialize jsPsych instance (MUST do this first in v7+)
const jsPsych = initJsPsych({
    show_progress_bar: true,
    on_finish: function() {
      jsPsych.data.displayData();
    }
  });
  
  const timeline = [];

  const instructions = {
    type: jsPsychInstructions,
    pages: [
      '<div class="content"><h2>Artificial Language Learning Study</h2>' +     
      '<p>In this experiment, you will be prompted with an image and asked, to the best of your ability, to select</p>' +
      '<p>the word that correctly corresponds to the image. In the first trial, you will be given feedback for your</p>' +
      '<p>choice. In the second trial, you will not. Please strive to be as accurate as possible.</p>' +
      '<p>Click "Next" to begin!</p></div>'
    ],
    show_clickable_nav: true,
  };
  timeline.push(instructions);

  
  
  // TRAINING TRIALS
  const trainingTrials = [
    {
      prompt: "FEK",
      promptImage: "stimuli/bear_adult_male_01.png",
      inoculator: "inoculator/adult_male.png",
      testImage: "stimuli/bear_child_01.png",
      choices: ['Fekrik', "Fekrul"]
    },
    {
      prompt: "QIK",
      promptImage: "stimuli/fox_adult_male_01.png",
      inoculator: "inoculator/adult_female.png",
      testImage: "stimuli/fox_child_01.png",
      choices: ['Qikrik', "Qikrul"]
    }
  ];
  
  trainingTrials.forEach(trial => {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div style="display: flex; align-items: center;">
        <div style="flex: 1; padding-right: 20px;">
        <p>This is called<strong> ${trial.prompt}</strong>.</p>
        <img src="${trial.promptImage}" height="150"><br>
        <p>What is this called?</p><br>
        <img src="${trial.testImage}" height="150"><br>
        </div>
        <div style="flex-shrink: 0;">
        <img src="${trial.inoculator}" height="250">
        </div>
        </div>
      `,
      choices: trial.choices
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
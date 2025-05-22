// Initialize jsPsych instance (MUST do this first in v7+)

const jsPsych = initJsPsych({
  show_progress_bar: true,
  on_finish: function() {
    jsPsych.data.displayData();
  }
});

const subject_id = jsPsych.randomization.randomID(10);
const filename = `${subject_id}.csv`;

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
  

function getRandomInterlocutor() {
    return interlocutorOptions[Math.floor(Math.random() * interlocutorOptions.length)];
  }
  
  function createTrialWithSuffix(baseTrial) {
    const interlocutor = getRandomInterlocutor();
    const suffix = interlocutor.gender === "female" ? "rik" : "rul";
    const correct = baseTrial.prompt + suffix;
  
    return {
      ...baseTrial,
      suffix: suffix,
      interlocutor: interlocutor.file,
      gender: interlocutor.gender,
      view: interlocutor.view,
      choices: [baseTrial.prompt + "rik", baseTrial.prompt + "rul"],
      correct: correct
    };
}

const shuffledBase = jsPsych.randomization.repeat(baseTrials, 1);
const trainingTrials = shuffledBase.map(createTrialWithSuffix);


const incorrectFeedbackTrial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p style='color:red; font-size: 24px;'>Incorrect! Please try again.</p>",
  choices: "NO_KEYS",
  trial_duration: 1000
};  

const incorrectFeedbackNode = {
  timeline: [incorrectFeedbackTrial],
  conditional_function: function() {
  const last = jsPsych.data.get().last(1).values()[0];
  return !last.correct;
}
};

const fixationCross = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<div style="font-size: 48px;">+</div>',
  choices: "NO_KEYS",
  trial_duration: 500, 
  data: {
    is_fixation: true 
  }
};

const attentionCheckTrial = {
  type: jsPsychSurveyText,
  preamble: function() {
    const last = jsPsych.data.get().filter({is_fixation: undefined}).last(1).values()[0];
    return `<p><strong>Attention check:</strong> Please type the name you gave to the last object.</p>`;
  },
  questions: [
    {
      prompt: "Type your answer here:",
      required: true
    }
  ],
  data: {
    attention_check: true
  },
  on_finish: function(data) {
    const last = jsPsych.data.get().filter({is_fixation: false, attention_check: false}).last(1).values()[0];
    const typed = (data.response["Q0"] || "").trim().toLowerCase();
    const expected = (last.prompt_label + last.suffix).trim().toLowerCase();
  
    data.typed_response = typed;
    data.expected_label = expected;
    data.correct = typed === expected;
  }
};

const attentionCheckNode = {
  timeline: [attentionCheckTrial],
};

const testPhaseAttentionCheck = {
  type: jsPsychHtmlButtonResponse,
  stimulus: '<p><strong>Attention Check</strong></p><p>Click the button labeled "Right".</p>',
  choices: ['Left', 'Right'],
  data: { task: 'attention-check', correct_response: 1 },
  on_finish: function(data) {
    data.correct = data.response === data.correct_response;
  }
}

const testPhaseAttentionCheckNode = {
  timeline: [testPhaseAttentionCheck],
};

let trialCounter = 0;

trainingTrials.forEach(trial => {
  const trialNode = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
          <style>
            .quote-box {
              border: 2px solid #ccc;
              padding: 16px;
              margin: 20px auto;
              border-radius: 8px;
              background-color: #f9f9f9;
              text-align: center;
            }
            .stimuli-image {
              display: block;
              margin: 10px auto;
              max-height: 150px;
            }
            .button-spacing {
              margin-top: 30px;
            }
          </style>

          <div style="display: flex; align-items: center;">
            <div style="flex: 1; padding-right: 20px;">
              <div class="quote-box">
                <p>This is called <strong>${trial.prompt}</strong>.</p>
                <img src="${trial.promptImage}" class="stimuli-image">
              </div>

              <p style="text-align: center;">What is this called?</p>

              <div class="quote-box">
                <img src="${trial.testImage}" class="stimuli-image">
              </div>

              <div class="button-spacing"></div>
            </div>

            <div style="flex-shrink: 0; width: 180px; height: 250px; display: flex; align-items: center; justify-content: center;">
            <img src="${trial.interlocutor}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
        `,
        choices: trial.choices,
        data: {
          correct_choice: trial.correct,
          prompt_label: trial.prompt,
          choices: trial.choices,
          suffix: trial.suffix,
          gender: trial.gender,
          view: trial.view,
          is_fixation: false,
          attention_check: false
        },
        on_finish: function(data) {
          const choice = data.response !== null ? data.choices[data.response] : null;
          data.correct = choice === data.correct_choice;
        }
      },
      incorrectFeedbackNode,
    ],
    loop_function: function(data) {
      const last = data.values().pop();
      return !last.correct;
    }
  };
  timeline.push(trialNode);
  trialCounter++;
  timeline.push(fixationCross)
  if (trialCounter % 3 === 0) {
    const attentionCheckNode = {
      timeline: [attentionCheckTrial]
    };
    timeline.push(attentionCheckNode);
  }
});

function filterInterlocutorsBy(gender, view) {
  return interlocutorOptions.filter(i => i.gender === gender && i.view === view);
}

function getBalancedInterlocutorsWithRepeats() {
  const combos = [
    ["male", "side"],
    ["female", "side"],
    ["male", "front"],
    ["female", "front"]
  ];

  let selected = [];
  combos.forEach(([gender, view]) => {
    const filtered = filterInterlocutorsBy(gender, view);
    const sampled = jsPsych.randomization.sampleWithReplacement(filtered, 6);
    selected = selected.concat(sampled);
  });

  return jsPsych.randomization.shuffle(selected); 
}

const balancedInterlocutors = getBalancedInterlocutorsWithRepeats();

const expandedBaseTrials = jsPsych.randomization.shuffle(testTrialsBasic);

function createTestTrialWithSuffix(baseTrial, interlocutor) {
  const suffix = interlocutor.gender === "female" ? "rik" : "rul";
  const correct = baseTrial.prompt + suffix;
  const choices = [baseTrial.prompt + "rik", baseTrial.prompt + "rul"];
  const shuffledChoices = jsPsych.randomization.shuffle(choices);


  return {
    ...baseTrial,
    suffix: suffix,
    interlocutor: interlocutor.file,
    gender: interlocutor.gender,
    view: interlocutor.view,
    choices: shuffledChoices,
    correct: correct
  };
}

const testTrials = expandedBaseTrials.map((base, i) =>
  createTestTrialWithSuffix(base, balancedInterlocutors[i])
);

const instructionsPhaseTwo = {
  type: jsPsychInstructions,
  pages: [
    '<div class="content"><h2>Phase 2</h2>' +     
    '<p>Thank you for completing the learning phase. In the next phase, you will be prompted with a single image</p>' +
    '<p>and an interlocutor. Please, to the best of your ability, select the option that best matches each prompt.</p>' +
    '<p>Click "Next" to begin!</p></div>'
  ],
  show_clickable_nav: true,
};

timeline.push(instructionsPhaseTwo);

let testTrialCounter = 0;
    
testTrials.forEach(trial => {
  const testNode = {
    timeline: [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
          <style>
            .test-trial-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin: 0 auto;
              max-width: 900px;
            }
            .test-stimulus {
              flex: 1;
              text-align: center;
            }
            .stimulus-box {
              border: 2px solid #ccc;
              padding: 20px;
              border-radius: 10px;
              display: inline-block;
              background-color: #f9f9f9;
            }
            .stimulus-image {
              height: 200px;
              max-width: 200px;
              object-fit: contain;
            }
            .interlocutor-image {
              height: 250px;
            }
            .button-spacing {
              margin-top: 30px;
            }
          </style>

         <div class="test-trial-container" style="display: flex; justify-content: center; gap: 40px; align-items: flex-start;">

        
        <div class="stimulus-box">
        <img src="${trial.testImage}" class="stimulus-image">
        </div>

      
        <div class="interlocutor-box">
        <div class="prompt-text">What would I call this?</div>
        <div class="button-spacing"></div>
        <img src="${trial.interlocutor}" class="interlocutor-image">
        </div>

        </div>

        <div class="button-spacing"></div>
        `,
        choices: trial.choices,
        data: {
          correct_choice: trial.correct,
          prompt_label: trial.prompt,
          suffix: trial.suffix,
          gender: trial.gender,
          view: trial.view,
          choices: trial.choices
        },
        on_finish: function(data) {
          const choice = data.response !== null ? data.choices[data.response] : null;
          data.correct = choice === data.correct_choice;
        }
      }
    ]
  };

  timeline.push(testNode);
  timeline.push(fixationCross);
  testTrialCounter++;
  if (testTrialCounter % 10 === 0) {
    const testPhaseAttentionCheckNode = {
      timeline: [testPhaseAttentionCheck]
    };
    timeline.push(testPhaseAttentionCheckNode);
  }
});

  const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "nJ8s7uIOyPpm",
    filename: filename,
    data_string: ()=>jsPsych.data.get().csv()
  };

  timeline.push(save_data)

  jsPsych.run(timeline);
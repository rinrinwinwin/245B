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
// TRAINING TRIALS

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
  

  const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "nJ8s7uIOyPpm",
    filename: filename,
    data_string: ()=>jsPsych.data.get().csv()
  };

  timeline.push(save_data)

  jsPsych.run(timeline);
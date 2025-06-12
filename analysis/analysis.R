library(tidyverse)
library(ggplot2)
library(lme4)
library(tools)

# Load in data
# This charming loop is courtesy of Claude 
# Set the directory path
data_dir <- "analysis/replicationStudyData"

print(data_dir)

# Get list of CSV File names 
csv_files <- list.files(path = data_dir, pattern = "\\.csv$", full.names = TRUE, recursive = FALSE)

if (length(csv_files) == 0) {
  cat("No CSV files found in the directory:", data_dir, "\n")
} else {
  data_list <- list()
  
  for (file in csv_files) {
    file_name <- file_path_sans_ext(basename(file))
    subject_id <- file_name
    
    message("Reading file: ", file)
    
    
    # cat("Loading file:", file, "\n")
    data_list[[file_name]] <- read.csv(file) %>% 
      mutate(subject_id = subject_id)
  }
}

length(data_list)        
df.data_raw <- bind_rows(data_list)
df.data_raw <- df.data_raw %>%
  mutate(
    correct = trimws(toupper(as.character(correct))) == "TRUE"
  )

library(dplyr)
df.guess <- df.data_raw %>%
  filter(!is.na(cue_guess)) %>%
  select(subject_id, cue_guess) %>%
  distinct(subject_id, .keep_all = TRUE)  # keep one row per participant

df.percent_accuracy <- df.percent_accuracy %>%
  left_join(df.guess, by = "subject_id")


str(df.data_raw$correct)
df.data_raw$test_trial <- tolower(as.character(df.data_raw$test_trial)) == "true"
df.data_raw$correct <- as.numeric(df.data_raw$correct)

#four group version
df.percent_accuracy <- df.data_raw %>%
  filter(
    tolower(as.character(test_trial)) == "true",
    !is.na(correct),
    !is.na(main_cue),
    !is.na(condition)
  ) %>%
  group_by(subject_id, main_cue, condition) %>%
  summarise(
    total_trials = n(),
    num_correct = sum(correct),
    percent_accuracy = 100 * num_correct / total_trials,
    .groups = "drop"
  )

View(df.percent_accuracy)



# Inspect
print(head(df.percent_accuracy))

library(ggplot2)

ggplot(df.percent_accuracy, aes(x = main_cue, y = percent_accuracy, color = main_cue)) +
  geom_jitter(width = 0.2, alpha = 0.6, size = 2) +
  stat_summary(fun = mean, geom = "point", shape = 18, size = 4, color = "black") +
  labs(
    title = "Participant Accuracy by Main Cue",
    x = "Main Cue",
    y = "Percent Accuracy"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

ggplot(df.percent_accuracy, aes(x = main_cue, y = percent_accuracy, color = main_cue)) +
  geom_jitter(width = 0.2, alpha = 0.6, size = 2) +
  stat_summary(fun = mean, geom = "point", shape = 18, size = 4, color = "black") +
  facet_wrap(~ condition) +
  labs(
    title = "Percent Accuracy by Main Cue and Condition",
    x = "Main Cue",
    y = "Percent Accuracy"
  ) +
  theme_minimal() +
  theme(legend.position = "none")

library(dplyr)

df.summary <- df.percent_accuracy %>%
  group_by(main_cue, condition) %>%
  summarise(
    mean_accuracy = mean(percent_accuracy, na.rm = TRUE),
    sd = sd(percent_accuracy, na.rm = TRUE),
    n = n(),
    se = sd / sqrt(n),
    ci_lower = mean_accuracy - 1.96 * se,
    ci_upper = mean_accuracy + 1.96 * se,
    .groups = "drop"
  )

library(ggplot2)

ggplot(df.summary, aes(x = main_cue, y = mean_accuracy, fill = main_cue)) +
  geom_bar(stat = "identity", color = "black", position = position_dodge(width = 0.9)) +
  geom_errorbar(
    aes(ymin = ci_lower, ymax = ci_upper),
    width = 0.2,
    position = position_dodge(width = 0.9)
  ) +
  facet_wrap(~ condition) +
  labs(
    title = "Mean Accuracy by Cue and Condition with 95% CI",
    x = "Main Cue",
    y = "Percent Accuracy"
  ) +
  theme_minimal() +
  ylim(0, 100) +
  theme(legend.position = "none")

df.guess %>%
  mutate(clean_guess = tolower(trimws(cue_guess))) %>%
  summarise(
    total = n(),
    none_or_na = sum(is.na(clean_guess) | clean_guess == "none"),
    percent_none_or_na = 100 * none_or_na / total
  )








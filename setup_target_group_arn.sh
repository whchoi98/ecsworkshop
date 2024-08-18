#!/bin/bash

# Retrieve the ARN of the MyTargetGroup and store it in a variable
UI_TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names MyTargetGroup --query 'TargetGroups[0].TargetGroupArn' --output text)

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Successfully retrieved the Target Group ARN."

  # Add the variable to the ~/.bashrc file for persistence
  echo "export UI_TARGET_GROUP_ARN=${UI_TARGET_GROUP_ARN}" >> ~/.bashrc

  # Reload the ~/.bashrc to apply the changes
  source ~/.bashrc

  echo "UI_TARGET_GROUP_ARN has been added to ~/.bashrc and loaded into the current session."
else
  echo "Failed to retrieve the Target Group ARN. Please check if the Target Group name is correct."
fi

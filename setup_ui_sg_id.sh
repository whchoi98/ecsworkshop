#!/bin/bash

# Retrieve the Security Group ID of UI_SG and store it in a variable
UI_SG_ID=$(aws ec2 describe-security-groups --group-names UI_SG --query 'SecurityGroups[0].GroupId' --output text)

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Successfully retrieved the Security Group ID."

  # Add the variable to the ~/.bashrc file for persistence
  echo "export UI_SG_ID=${UI_SG_ID}" >> ~/.bashrc

  # Reload the ~/.bashrc to apply the changes
  source ~/.bashrc

  echo "UI_SG_ID has been added to ~/.bashrc and loaded into the current session."
else
  echo "Failed to retrieve the Security Group ID. Please check if the Security Group name is correct."
fi

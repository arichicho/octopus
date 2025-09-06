#!/bin/bash

echo "🚀 Creating Firebase App Hosting backend..."

# Use expect to automate firebase init apphosting
expect << 'EOF'
set timeout 300
spawn firebase init apphosting

# Wait for the first prompt
expect "Please select an option"
send "\r"

# Wait for region selection
expect "Select a primary region"
send "\033\[B\033\[B\r"

# Wait for repository detection
expect {
    "Detected repository" {
        send "y\r"
    }
    "What is the name of the GitHub repository" {
        send "arichicho/octopus\r"
    }
    "GitHub repository" {
        send "arichicho/octopus\r"
    }
}

# Wait for GitHub workflow setup
expect "Set up automatic builds" {
    send "y\r"
}

# Wait for repository confirmation
expect {
    "For which GitHub repository" {
        send "\r"
    }
    "repository" {
        send "\r"
    }
}

# Wait for workflow setup
expect {
    "Set up a GitHub workflow" {
        send "\r"
    }
    "workflow" {
        send "\r"
    }
    eof
}

expect eof
EOF

echo "✅ Backend creation completed"
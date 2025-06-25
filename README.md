# AiLumni-Hub: University Sports Fan Dashboard

A dynamic sports dashboard app for university athletics fans, displaying personalized team schedules, standings, and updates with a modern UI.

## Overview

AiLumni-Hub provides university sports fans with a personalized dashboard for following their favorite teams. The app offers standings tables, upcoming games, recent results, and fundraising options with a clean, modern interface optimized for both desktop and mobile viewing.

## Features

- **Team Dashboard**: View standings, upcoming games, and recent results
- **Dynamic Theming**: Colors adapt to the selected team's branding
- **Team Selection**: Support for multiple universities and sports
- **Modern UI**: Responsive design with smooth transitions and intuitive navigation
- **Offline Support**: Caching for offline viewing capabilities

## Team Testing Framework

AiLumni-Hub includes a powerful testing framework that makes it easy to test new teams without manual configuration. See [TESTING.md](TESTING.md) for details.

Quick test with a predefined team:
```bash
./test-team.sh --usd
```

Or create a custom team:
```bash
./test-team.sh --name "My Team" --primary "#FF0000" --secondary "#0000FF"
```

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/vue/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
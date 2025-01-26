# Peepel Video Chat

A real-time video chat application built with React, WebRTC, and Firebase.

## Features

- Real-time video chat
- Text messaging
- Friend requests
- User profiles
- Admin dashboard
- Responsive design

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Firebase
- WebRTC
- WebSocket

## Getting Started

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/peepel-video-chat.git
\`\`\`

2. Install dependencies:
\`\`\`bash
cd peepel-video-chat
npm install
\`\`\`

3. Create a .env file based on .env.example and fill in your configuration values.

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

## Environment Variables

Copy .env.example to .env and fill in your values:

- PORT: Server port (default: 8080)
- TURN_PORT: TURN server port (default: 3478)
- TURN_USERNAME: TURN server username
- TURN_PASSWORD: TURN server password
- TURN_REALM: TURN server realm
- CORS_ORIGIN: CORS origin (default: *)
- RATE_LIMIT_WINDOW: Rate limit window in minutes
- RATE_LIMIT_MAX: Maximum requests per window

## Scripts

- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm start\`: Start production server
- \`npm run lint\`: Run ESLint

## License

MIT
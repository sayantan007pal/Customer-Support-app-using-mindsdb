# Customer Support Chatbot using MindsDB

A modern, AI-powered customer support chatbot application built with React, TypeScript, and MindsDB Knowledge Bases.

## Features

- **Intelligent Chat Interface**: Modern React-based chat UI with real-time messaging
- **AI-Powered Responses**: Leverages MindsDB's AI capabilities for intelligent customer support
- **Knowledge Base Integration**: Uses MindsDB Knowledge Bases for FAQ, product manuals, and troubleshooting guides
- **Semantic Search**: Advanced search capabilities for accurate information retrieval
- **Test-Driven Development**: Comprehensive testing with Jest and React Testing Library
- **TypeScript**: Full type safety throughout the application

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Headless UI** for accessible components

### Backend
- **Node.js** with Express and TypeScript
- **MindsDB** for AI and database operations
- **Knowledge Bases** for content storage and retrieval

### Testing
- **Jest** for unit and integration testing
- **React Testing Library** for component testing
- **Supertest** for API testing

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MindsDB account and API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sayantan007pal/Customer-Support-app-using-mindsdb.git
cd Customer-Support-app-using-mindsdb
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Set up environment variables:
```bash
# Create .env file in the root directory
# Add your MindsDB credentials and configuration
```

### Development

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
npm run dev
```

3. Run tests:
```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   └── types/             # TypeScript type definitions
├── backend/               # Backend source code
│   ├── src/
│   │   ├── config/        # Database and configuration
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
│   └── tests/             # Backend tests
└── public/                # Static assets
```

## MindsDB Integration

This application uses MindsDB's powerful features:

- **Knowledge Bases**: Store and retrieve FAQ, manuals, and guides
- **AI Tables**: Generate intelligent responses using OpenAI models
- **Semantic Search**: Find relevant information based on user queries
- **Jobs**: Automated content ingestion and updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Implement your feature
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

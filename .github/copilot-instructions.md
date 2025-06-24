# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Customer Support Chatbot application built with MindsDB Knowledge Bases following test-driven development principles.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MindsDB with Knowledge Bases
- **AI Integration**: OpenAI GPT models through MindsDB
- **Testing**: Jest, React Testing Library, Supertest
- **UI Components**: Tailwind CSS, Headless UI

## Architecture Guidelines
- Follow test-driven development (TDD) practices
- Use TypeScript for type safety
- Implement semantic search through MindsDB Knowledge Bases
- Create AI Tables for response generation and query classification
- Use Jobs for automated content ingestion
- Implement proper error handling and logging
- Follow React best practices with hooks and context

## Testing Guidelines
- Write tests before implementation
- Use Jest for unit and integration tests
- Use React Testing Library for component testing
- Use Supertest for API endpoint testing
- Aim for high test coverage (>90%)
- Mock external dependencies properly

## MindsDB Integration
- Use Knowledge Bases for storing FAQ, product manuals, troubleshooting guides
- Implement metadata filtering (category, priority, product type)
- Create AI Tables for intelligent response generation
- Set up Jobs for automated content updates
- Use semantic search capabilities for accurate information retrieval

## Code Quality
- Use ESLint and Prettier for code formatting
- Follow conventional commits
- Implement proper error boundaries
- Use proper TypeScript types
- Follow SOLID principles

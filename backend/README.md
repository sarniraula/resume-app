# Resume Checker Backend

Node.js/Express backend with Ollama AI integration for resume analysis.

## Features

- 📄 PDF and DOCX file parsing
- 🤖 AI-powered resume analysis using Ollama (Llama3)
- 📊 ATS score calculation
- 🔍 Keyword matching and gap analysis
- 💡 Improvement suggestions

## Local Development

### Prerequisites

- Node.js 20+
- Ollama installed locally
- Llama3 model pulled

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5001
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
EOF

# Start Ollama (in separate terminal)
ollama serve

# Pull Llama3 model
ollama pull llama3

# Start development server
npm run dev
```

### API Endpoints

#### Health Check
```bash
GET /health
```

#### Analyze Resume
```bash
POST /analyze
Content-Type: multipart/form-data

Fields:
- resume: File (PDF/DOCX)
- jd: File (PDF/DOCX/TXT)
```

Response:
```json
{
  "overall_score": 85,
  "keyword_matches": ["JavaScript", "React", "Node.js"],
  "missing_keywords": ["TypeScript", "AWS"],
  "formatting_tips": ["Use bullet points", "Add metrics"],
  "improvement_suggestions": ["Highlight achievements", "Add certifications"],
  "highlighted_resume": "..."
}
```

## Production Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for AWS EC2 deployment instructions.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5001` |
| `OLLAMA_URL` | Ollama API endpoint | `http://localhost:11434/api/generate` |
| `OLLAMA_MODEL` | Model to use | `llama3` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | - |

## Project Structure

```
backend/
├── server.js              # Express server
├── services/
│   ├── parser.js          # PDF/DOCX text extraction
│   └── ollamaService.js   # AI analysis logic
├── ecosystem.config.js    # PM2 configuration
├── deploy-aws.sh          # AWS deployment script
└── package.json
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prod` - Start with PM2
- `npm run stop` - Stop PM2 process
- `npm run restart` - Restart PM2 process
- `npm run logs` - View PM2 logs

## License

MIT

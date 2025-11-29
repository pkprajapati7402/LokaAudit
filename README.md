# LokaAudit - AI-Powered Smart Contract Security Platform

🔒 **Production-grade security auditing for smart contracts with Google Gemini AI integration**

LokaAudit is an advanced security auditing platform that combines automated vulnerability detection with AI-powered analysis to deliver comprehensive, enterprise-ready audit reports. Now featuring Google's Gemini AI for production-grade detailed analysis with business context and actionable recommendations.

## ✨ Key Features

### 🤖 AI-Enhanced Auditing
- **Gemini AI Integration**: Production-grade analysis with business context
- **Intelligent Vulnerability Assessment**: Context-aware severity scoring
- **Executive Reporting**: C-level appropriate risk assessments
- **Attack Scenario Modeling**: Detailed exploitation pathways

### 🔍 Comprehensive Analysis
- **Multi-Chain Support**: Solana (more chains coming soon)
- **Automated Testing**: Dynamic test case generation
- **Static Analysis**: AST-based vulnerability detection
- **Documentation Generation**: Automated technical documentation

### 📊 Enterprise Features
- **Professional Reports**: Export-ready PDF documentation
- **Test Execution**: Virtual environment testing
- **Result Management**: Comprehensive audit history
- **REST API**: Programmatic access to all features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Google Gemini API key (for AI features)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/LokaAudit-2.git
cd LokaAudit-2

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Setup environment
cp .env.example .env
# Add your configuration (MongoDB, Gemini API key, etc.)
```

### Configuration
```bash
# Backend environment (.env)
MONGODB_URI=mongodb://localhost:27017/lokaudit
GEMINI_API_KEY=your_gemini_api_key_here
ENABLE_AI_ENHANCEMENT=true
PORT=3001

# Start services
npm run dev  # Frontend (Next.js)
cd backend && npm run dev  # Backend (Express)
```

## 🤖 AI-Powered Features

### 📋 [**Complete Gemini AI Integration Guide**](./GEMINI_AI_README.md)

Experience the next level of smart contract auditing with AI-enhanced reports featuring:

- **Executive Summaries**: Business risk assessment and deployment readiness
- **Technical Analysis**: Detailed vulnerability explanations with context
- **Attack Scenarios**: Real-world exploitation pathways
- **Remediation Guidance**: Step-by-step implementation instructions
- **Compliance Mapping**: Industry standards alignment
- **Threat Modeling**: Advanced security threat analysis

## 📖 Documentation

### Project Structure
```
LokaAudit-2/
├── src/                     # Frontend (Next.js)
│   ├── app/                 # App router pages
│   │   ├── api/             # API routes
│   │   ├── audit/           # Audit interface
│   │   ├── documentation/   # Documentation generator
│   │   ├── reports/         # Report viewer
│   │   └── test-case/       # Test management
│   ├── components/          # React components
│   └── lib/                 # Utilities and services
├── backend/                 # Backend (Express.js)
│   ├── src/
│   │   ├── services/        # Core services
│   │   ├── pipelines/       # Audit pipelines
│   │   ├── types/           # TypeScript definitions
│   │   └── routes/          # API endpoints
│   └── test-*.ts            # Integration tests
└── public/                  # Static assets
```

### Core Services

#### 🔍 Audit Pipeline
- **Solana Pipeline**: Specialized for Solana smart contracts
- **AST Parser**: Abstract syntax tree analysis
- **Vulnerability Detection**: Pattern-based security analysis
- **Test Generation**: Automated test case creation

#### 🤖 AI Enhancement
- **GeminiAuditEnhancer**: Production-grade AI analysis service
- **Business Context**: Real-world impact assessment
- **Executive Reporting**: C-level risk communication
- **Threat Modeling**: Advanced security analysis

#### 📊 Data Management
- **MongoDB Integration**: Audit history and results
- **File Management**: Source code and report handling
- **Result Processing**: Analysis aggregation and reporting

## 🛠️ API Reference

### Core Endpoints

#### Upload & Analysis
```bash
POST /api/upload          # Upload smart contract files
POST /api/projects        # Create new audit project
GET  /api/projects        # List all projects
```

#### Testing & Generation
```bash
POST /api/tests/generate  # Generate test cases
POST /api/tests/execute   # Execute tests
GET  /api/tests/results   # Get test results
POST /api/tests/export    # Export test data
```

#### Documentation & Reports
```bash
POST /api/generate-documentation  # Generate technical docs
GET  /api/download                # Download reports
```

### Example Usage
```javascript
// Upload contract for analysis
const formData = new FormData();
formData.append('file', contractFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Result includes AI-enhanced analysis when Gemini is configured
```

## 🔒 Security Features

### Vulnerability Detection
- **Access Control Issues**: Unauthorized function access
- **Integer Overflow/Underflow**: Arithmetic vulnerabilities
- **Reentrancy Attacks**: State manipulation vulnerabilities
- **Logic Flaws**: Business logic vulnerabilities
- **Input Validation**: Data sanitization issues

### AI-Enhanced Analysis
- **Context-Aware Scoring**: Intelligent severity assessment
- **Business Impact**: Real-world consequence analysis
- **Attack Vectors**: Exploitation pathway identification
- **Remediation Priority**: Risk-based fix ordering

## 📊 Test Management

### Automated Test Generation
```typescript
// AI-powered test case generation
const testCases = await generateTests({
  contractCode: sourceCode,
  vulnerabilities: findings,
  testTypes: ['security', 'functionality', 'edge-cases']
});
```

### Test Execution
- **Virtual Environment**: Isolated test execution
- **Comprehensive Coverage**: Security and functionality tests
- **Result Analysis**: Detailed test outcome reporting
- **Export Capabilities**: Test data and results export

## 🎯 Use Cases

### For Security Teams
- **Comprehensive Audits**: Full contract security analysis
- **Risk Assessment**: Business impact evaluation  
- **Compliance**: Industry standards alignment
- **Threat Modeling**: Advanced attack analysis

### For Development Teams  
- **Code Quality**: Automated code review
- **Test Generation**: Comprehensive test suites
- **Documentation**: Automated technical docs
- **CI/CD Integration**: Pipeline security checks

### For Management
- **Executive Reports**: C-level risk communication
- **Deployment Decisions**: Go/no-go recommendations
- **Resource Planning**: Effort estimation for fixes
- **Compliance Tracking**: Regulatory alignment

## 🌟 Advanced Features

### AI-Powered Analysis
- **Business Context**: Impact on operations and revenue
- **Attack Scenarios**: Real-world exploitation examples
- **Implementation Guidance**: Step-by-step remediation
- **Compliance Mapping**: Regulatory standards alignment

### Professional Reporting
- **Executive Summaries**: Business risk assessment
- **Technical Details**: Developer-focused analysis
- **Visual Reports**: Charts and vulnerability matrices
- **Export Options**: PDF, JSON, and other formats

### Integration Capabilities
- **REST API**: Programmatic access
- **Webhook Support**: Event-driven notifications
- **CI/CD Integration**: Pipeline security checks
- **Custom Pipelines**: Extensible audit workflows

## 🔧 Development

### Local Development
```bash
# Frontend development
npm run dev

# Backend development  
cd backend && npm run dev

# Run tests
npm test
cd backend && npm test

# Build for production
npm run build
cd backend && npm run build
```

### Testing
```bash
# Test Gemini AI integration
cd backend && npx tsx test-gemini-integration.ts

# Run MongoDB tests
npx tsx test-mongo.js

# API integration tests
npx tsx test-api.js
```

## 📝 Configuration

### Environment Variables
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/lokaudit
GEMINI_API_KEY=your_gemini_api_key_here
ENABLE_AI_ENHANCEMENT=true
PORT=3001
LOG_LEVEL=info

# Optional: Advanced AI features
ENABLE_DEBUG_LOGGING=false
AI_ENHANCEMENT_TIMEOUT=60000
```

### MongoDB Setup
```javascript
// Automatic database setup on first run
// Collections: projects, audits, test_results, sessions
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Commit** your changes
4. **Push** to the branch  
5. **Create** a Pull Request

### Development Workflow
- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Ensure AI features are backward compatible

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Complete guides and examples
- **Issues**: GitHub issue tracking
- **Discussions**: Community Q&A
- **Email**: support@lokaudit.com

## 🚀 Roadmap

### Current Features
- ✅ Solana smart contract auditing
- ✅ AI-enhanced analysis with Gemini
- ✅ Automated test generation
- ✅ Professional report generation
- ✅ MongoDB integration
- ✅ REST API

### Coming Soon
- 🔄 Ethereum/EVM support
- 🔄 Multi-chain analysis
- 🔄 Advanced visualization
- 🔄 Real-time monitoring
- 🔄 Team collaboration features
- 🔄 Enterprise SSO integration

---

## 🌟 Get Started Today

1. **Clone** the repository
2. **Configure** your environment (MongoDB + Gemini API)
3. **Run** the integration tests
4. **Upload** your first smart contract
5. **Experience** AI-powered security analysis

Ready to revolutionize your smart contract security? 

**[📖 Read the Complete Gemini AI Guide](./GEMINI_AI_README.md)**

---

*Built with ❤️ by the LokaAudit team. Securing the decentralized future, one contract at a time.*
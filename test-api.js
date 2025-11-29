// Simple test script to debug the API
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log(' Testing test generation API...');
    
    // Test data that matches the expected format
    const testData = {
      projectId: "Test Project", // This should match a project name in your database
      selectedFiles: ["test.rs"],
      testType: "functional",
      language: "rust",
      options: {
        includeEdgeCases: true,
        generateMockData: false,
        complexity: "intermediate"
      }
    };
    
    const url = 'http://localhost:3001/api/tests/generate?developerId=Dev%203';
    
    console.log(' Sending request to:', url);
    console.log(' Request body:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(' Response status:', response.status, response.statusText);
    
    const result = await response.text();
    console.log(' Response body:', result);
    
    if (response.ok) {
      console.log(' API test successful!');
    } else {
      console.log('API test failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAPI();

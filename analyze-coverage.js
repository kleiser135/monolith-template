/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

// Read the coverage file
const coverageData = JSON.parse(fs.readFileSync('./coverage/coverage-final.json', 'utf8'));

// Analyze each file and calculate uncovered lines
const fileAnalysis = [];

Object.entries(coverageData).forEach(([filePath, data]) => {
  const statements = data.statementMap || {};
  const statementCounts = data.s || {};
  
  let totalStatements = 0;
  let uncoveredStatements = 0;
  let uncoveredLines = new Set();
  
  Object.entries(statements).forEach(([statementId, statementInfo]) => {
    totalStatements++;
    const executionCount = statementCounts[statementId] || 0;
    
    if (executionCount === 0) {
      uncoveredStatements++;
      // Add all lines in the statement range
      for (let line = statementInfo.start.line; line <= statementInfo.end.line; line++) {
        uncoveredLines.add(line);
      }
    }
  });
  
  const coverage = totalStatements > 0 ? ((totalStatements - uncoveredStatements) / totalStatements * 100) : 100;
  
  fileAnalysis.push({
    file: path.relative(process.cwd(), filePath),
    totalStatements,
    uncoveredStatements,
    uncoveredLines: uncoveredLines.size,
    coverage: Math.round(coverage * 100) / 100
  });
});

// Sort by number of uncovered lines (descending)
fileAnalysis.sort((a, b) => b.uncoveredLines - a.uncoveredLines);

console.log('Files with the most uncovered lines:');
console.log('=====================================');
fileAnalysis.slice(0, 15).forEach((file, index) => {
  console.log(`${index + 1}. ${file.file}`);
  console.log(`   Uncovered lines: ${file.uncoveredLines}`);
  console.log(`   Uncovered statements: ${file.uncoveredStatements}/${file.totalStatements}`);
  console.log(`   Coverage: ${file.coverage}%`);
  console.log('');
});

// Calculate overall stats
const totalFiles = fileAnalysis.length;
const totalUncoveredLines = fileAnalysis.reduce((sum, file) => sum + file.uncoveredLines, 0);
const totalStatements = fileAnalysis.reduce((sum, file) => sum + file.totalStatements, 0);
const totalUncoveredStatements = fileAnalysis.reduce((sum, file) => sum + file.uncoveredStatements, 0);

console.log('Overall Statistics:');
console.log('==================');
console.log(`Total files: ${totalFiles}`);
console.log(`Total uncovered lines: ${totalUncoveredLines}`);
console.log(`Overall coverage: ${Math.round((totalStatements - totalUncoveredStatements) / totalStatements * 10000) / 100}%`);

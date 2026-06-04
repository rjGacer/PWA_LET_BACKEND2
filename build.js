#!/usr/bin/env node
/**
 * Build script for Render deployment
 * Injects backend URL into index.html as a meta tag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000/api/v1';
const inputFile = path.join(__dirname, 'index.html');
const outputFile = path.join(__dirname, 'index.html');

if (!fs.existsSync(inputFile)) {
  console.error(`Error: ${inputFile} not found`);
  process.exit(1);
}

let html = fs.readFileSync(inputFile, 'utf8');

// Add backend URL meta tag in the head section
const metaTag = `<meta name="backend-url" content="${backendUrl}">`;
const headClosing = '</head>';

if (html.includes(metaTag)) {
  console.log('✓ Meta tag already present');
} else if (html.includes(headClosing)) {
  // Insert meta tag before </head>
  html = html.replace(headClosing, `  ${metaTag}\n  ${headClosing}`);
  fs.writeFileSync(outputFile, html);
  console.log(`✓ Backend URL injected: ${backendUrl}`);
} else {
  console.warn('⚠ Could not find </head> tag in index.html');
}

/**
 * Tool to generate a data/hljs-alias-file.json file that maps language aliases to language grammars in hljs.
 * 
 * This is necessary as multiple languages in hljs map to the same grammar. However, hljs itself lets each grammar register itself,
 * upon which it declares all aliases it supports (the inverse of what we need). We need a mapping from alias to grammar for lazy-loading
 * of grammars to work, as the alias is what appears in code blocks (i.e., language-XXX), but we need to know which grammar to load in that case.
 * 
 * This script analyzes all supported grammars in node_modules/highlight.js/** and builds the file with the mapping from each language to each grammar.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates a mapping of aliases to their source language files
 * @param {string} outputFileName - The output file name (or path where mapping will be saved)
 * @returns {Promise<Object>} Object with aliases as keys and file names as values
 */
export async function generateMapping(outputFileName) {
  const languagesDir = path.resolve(__dirname, '../node_modules/highlight.js/lib/languages');

  // Read all files from the languages directory
  const files = fs.readdirSync(languagesDir).filter(file => file.endsWith('.js'));

  // Map to track aliases to their source files
  const aliasMapping = {};

  // Process each language file
  for (const file of files) {
    const filePath = path.resolve(languagesDir, file);
    const fileName = path.parse(file).name; // Get filename without extension

    // Skip files that end with .js.js (duplicate entries)
    if (fileName.endsWith('.js')) continue;

    // Add the filename itself as a key pointing to itself
    aliasMapping[fileName] = fileName;

    try {
      // Read the file as text and extract aliases using regex
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Match the aliases array pattern with flexible whitespace (including newlines)
      // Matches: aliases: [...], aliases : [...], aliases:[...] etc.
      const aliasMatch = content.match(/aliases\s*:\s*\[([^\]]*)\]/s);
      
      if (aliasMatch) {
        // Extract the content between brackets
        const aliasesContent = aliasMatch[1];
        
        // Extract quoted strings - handles single quotes, double quotes, and backticks
        // Matches: 'string', "string", `string`
        // Also handles mixed whitespace and newlines within the array
        const aliasMatches = aliasesContent.match(/'[^']*'|"[^"]*"|`[^`]*`/g);
        
        if (aliasMatches) {
          // Extract the content within quotes (remove surrounding quotes)
          aliasMatches.forEach(match => {
            // Remove surrounding quotes (first and last character)
            const alias = match.slice(1, -1);
            aliasMapping[alias] = fileName;
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to process ${file}: ${error.message}`);
    }
  }

  // optionally save to file if outputFileName is provided
  if (outputFileName) {
    fs.writeFileSync(
      outputFileName,
      JSON.stringify(aliasMapping, null, 2),
      'utf8'
    );
  }

  return aliasMapping;
}

#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

/**
 * Script pour formater les templates Angular avec indentation correcte des directives @if, @for, @switch, etc.
 */

function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findHtmlFiles(fullPath, files)
    } else if (stat.isFile() && item.endsWith('.html')) {
      files.push(fullPath)
    }
  }

  return files
}

function formatAngularDirectives(content) {
  // Patterns pour les directives Angular
  const patterns = [
    // @if, @else if, @else
    {
      regex: /^(\s*)@(if|else\s+if|else)\s*(\([^)]*\))?\s*\{?\s*$/gm,
      replacement: '$1@$2$3 {',
    },
    // @for
    {
      regex: /^(\s*)@for\s*(\([^)]*\))\s*\{?\s*$/gm,
      replacement: '$1@for $2 {',
    },
    // @switch
    {
      regex: /^(\s*)@switch\s*(\([^)]*\))\s*\{?\s*$/gm,
      replacement: '$1@switch $2 {',
    },
    // @case
    {
      regex: /^(\s*)@case\s*(\([^)]*\))\s*\{?\s*$/gm,
      replacement: '$1@case $2 {',
    },
    // @default
    {
      regex: /^(\s*)@default\s*\{?\s*$/gm,
      replacement: '$1@default {',
    },
    // Fermeture des blocs
    {
      regex: /^(\s*)\}\s*$/gm,
      replacement: '$1}',
    },
  ]

  let formattedContent = content

  // Appliquer les patterns
  patterns.forEach((pattern) => {
    formattedContent = formattedContent.replace(pattern.regex, pattern.replacement)
  })

  // Corriger l'indentation après les directives Angular
  const lines = formattedContent.split('\n')
  const formattedLines = []
  let indentLevel = 0
  const indentSize = 2

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Gérer les directives de fermeture
    if (trimmedLine === '}') {
      indentLevel = Math.max(0, indentLevel - 1)
      formattedLines.push(' '.repeat(indentLevel * indentSize) + '}')
      continue
    }

    // Gérer les directives d'ouverture
    if (trimmedLine.match(/^@(if|else\s+if|else|for|switch|case|default)/)) {
      formattedLines.push(' '.repeat(indentLevel * indentSize) + trimmedLine)
      if (trimmedLine.endsWith('{')) {
        indentLevel++
      }
      continue
    }

    // Pour les autres lignes, maintenir l'indentation existante mais ajuster selon le niveau
    if (trimmedLine) {
      const currentIndent = line.length - line.trimStart().length
      const expectedIndent = indentLevel * indentSize

      // Si la ligne semble être du contenu à l'intérieur d'une directive Angular
      if (currentIndent < expectedIndent && i > 0) {
        const prevLine = lines[i - 1].trim()
        if (prevLine.match(/^@(if|else\s+if|else|for|switch|case|default).*\{$/)) {
          formattedLines.push(' '.repeat(expectedIndent) + trimmedLine)
          continue
        }
      }
    }

    formattedLines.push(line)
  }

  return formattedLines.join('\n')
}

function formatFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const formatted = formatAngularDirectives(content)

    if (content !== formatted) {
      fs.writeFileSync(filePath, formatted, 'utf8')
      console.log(`✅ Formaté: ${filePath}`)
      return true
    }

    return false
  } catch (error) {
    console.error(`❌ Erreur lors du formatage de ${filePath}:`, error.message)
    return false
  }
}

function main() {
  const srcDir = path.join(__dirname, 'src')

  if (!fs.existsSync(srcDir)) {
    console.error('❌ Dossier src/ non trouvé')
    process.exit(1)
  }

  console.log('🚀 Formatage des templates Angular...')

  const htmlFiles = findHtmlFiles(srcDir)
  console.log(`📁 ${htmlFiles.length} fichiers HTML trouvés`)

  let formattedCount = 0

  htmlFiles.forEach((file) => {
    if (formatFile(file)) {
      formattedCount++
    }
  })

  console.log(`✨ ${formattedCount} fichiers formatés`)

  // Exécuter Prettier après notre formatage personnalisé
  try {
    console.log('🎨 Exécution de Prettier...')
    execSync('npx prettier --write "src/**/*.html"', { stdio: 'inherit' })
    console.log('✅ Prettier terminé')
  } catch (error) {
    console.error('❌ Erreur Prettier:', error.message)
  }
}

if (require.main === module) {
  main()
}

module.exports = { formatAngularDirectives, formatFile }

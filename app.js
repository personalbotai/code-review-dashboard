// Code Review Dashboard - Static Analysis & AI Suggestions

// Sample project structure for demo
const sampleProject = {
    name: "Sample Project",
    files: {
        "main.go": {
            lang: "go",
            code: `package main

import (
    "fmt"
    "os"
)

func main() {
    // TODO: add error handling
    data, _ := os.ReadFile("config.json")
    fmt.Println(string(data))
    
    // Magic number
    result := process(42)
    fmt.Println(result)
}

func process(x int) int {
    return x * 2 + 1
}`
        },
        "utils.go": {
            lang: "go",
            code: `package utils

import "crypto/md5"

// Weak hash function
func HashPassword(password string) string {
    return fmt.Sprintf("%x", md5.Sum([]byte(password)))
}

// Export all functions (should be limited)
func Helper1() {}
func Helper2() {}
func Helper3() {}`
        },
        "api.go": {
            lang: "go",
            code: `package api

import "net/http"

func handler(w http.ResponseWriter, r *http.Request) {
    // No input validation
    name := r.URL.Query().Get("name")
    w.Write([]byte("Hello " + name))
}

func setupRoutes() {
    http.HandleFunc("/hello", handler)
}`
        },
        "config.json": {
            lang: "json",
            code: `{
  "port": 8080,
  "debug": true,
  "database": {
    "host": "localhost",
    "user": "admin",
    "password": "admin123"
  }
}`
        },
        "readme.md": {
            lang: "markdown",
            code: `# Sample Project

## Setup
\`\`\`bash
go run main.go
\`\`\`

## API
GET /hello?name=...`
        }
    }
};

// Rule definitions for static analysis
const rules = {
    go: [
        {
            id: 'magic-number',
            severity: 'medium',
            title: 'Magic Number',
            pattern: /(=\s*)(\d{2,})(\s|$|\n)/g,
            message: 'Avoid magic numbers. Use named constants.',
            suggestion: 'const MaxRetries = 5'
        },
        {
            id: 'unused-import',
            severity: 'low',
            title: 'Unused Import',
            pattern: /import\s*\(\s*["']([^"']+)["']\s*(?![^)]*\))/g,
            message: 'Import declared but may be unused.',
            suggestion: 'Remove unused imports or use them.'
        },
        {
            id: 'error-ignored',
            severity: 'high',
            title: 'Error Ignored',
            pattern: /=\s*_[,\s]*\)/g,
            message: 'Error value is ignored. Handle errors properly.',
            suggestion: 'if err != nil { /* handle */ }'
        },
        {
            id: 'weak-crypto',
            severity: 'critical',
            title: 'Weak Cryptographic Hash',
            pattern: /md5|sha1/gi,
            message: 'MD5/SHA1 are cryptographically broken. Use SHA-256 or bcrypt.',
            suggestion: 'Use golang.org/x/crypto/bcrypt or crypto/sha256'
        },
        {
            id: 'hardcoded-secret',
            severity: 'critical',
            title: 'Hardcoded Secret',
            pattern: /password|secret|token|key\s*[:=]\s*["'][^"']{4,}["']/gi,
            message: 'Hardcoded secrets found. Use environment variables.',
            suggestion: 'os.Getenv("DB_PASSWORD")'
        },
        {
            id: 'missing-validation',
            severity: 'high',
            title: 'Missing Input Validation',
            pattern: /r\.URL\.Query\(\)\.Get|r\.FormValue|json\.NewDecoder.*\.Decode/gi,
            message: 'User input used without validation.',
            suggestion: 'Validate and sanitize all inputs.'
        },
        {
            id: 'export-all',
            severity: 'medium',
            title: 'Exported Unnecessary Functions',
            pattern: /^func\s+[A-Z][a-zA-Z0-9]*\s*\(/gm,
            message: 'Multiple exported functions may indicate poor encapsulation.',
            suggestion: 'Consider making them unexported (lowercase) if not needed elsewhere.'
        }
    ],
    json: [
        {
            id: 'hardcoded-cred',
            severity: 'critical',
            title: 'Hardcoded Credentials',
            pattern: /"password"\s*:\s*"[^"]+"/gi,
            message: 'Plaintext password in config.',
            suggestion: 'Use environment variables or secret manager.'
        },
        {
            id: 'debug-enabled',
            severity: 'medium',
            title: 'Debug Mode Enabled',
            pattern: /"debug"\s*:\s*true/gi,
            message: 'Debug mode should be disabled in production.',
            suggestion: 'Set to false or use environment-specific config.'
        }
    ],
    markdown: []
};

class CodeReviewDashboard {
    constructor() {
        this.project = null;
        this.analysisResults = {};
        this.currentFile = null;
        this.init();
    }

    init() {
        // Auto-load sample on button click handled in HTML
    }

    loadSample() {
        this.project = JSON.parse(JSON.stringify(sampleProject));
        this.renderFileTree();
        document.getElementById('empty-state').classList.add('hidden');
        this.runAnalysis();
    }

    renderFileTree() {
        const tree = document.getElementById('file-tree');
        tree.innerHTML = '';
        Object.keys(this.project.files).forEach(filename => {
            const item = document.createElement('div');
            item.className = 'file-tree-item';
            item.innerHTML = `<i class="fas fa-file-code mr-2 text-gray-500"></i>${filename}`;
            item.onclick = () => this.selectFile(filename);
            tree.appendChild(item);
        });
    }

    selectFile(filename) {
        // Update active state
        document.querySelectorAll('.file-tree-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        this.currentFile = filename;
        const file = this.project.files[filename];
        
        // Show file analysis
        document.getElementById('file-analysis').classList.remove('hidden');
        document.getElementById('current-filename').textContent = filename;
        document.getElementById('current-file-lang').textContent = file.lang.toUpperCase();
        
        // Render code with highlight.js
        const codeView = document.getElementById('code-view');
        codeView.textContent = file.code;
        hljs.highlightElement(codeView);
        
        // Render issues for this file
        this.renderFileIssues(filename);
    }

    runAnalysis() {
        if (!this.project) {
            alert('Load sample atau paste kode terlebih dahulu');
            return;
        }

        this.analysisResults = {};
        let totalStats = { critical: 0, high: 0, medium: 0, low: 0, files: 0 };
        
        Object.entries(this.project.files).forEach(([filename, file]) => {
            const langRules = rules[file.lang] || [];
            const issues = [];
            
            langRules.forEach(rule => {
                let match;
                const regex = new RegExp(rule.pattern);
                while ((match = regex.exec(file.code)) !== null) {
                    issues.push({
                        ruleId: rule.id,
                        title: rule.title,
                        severity: rule.severity,
                        message: rule.message,
                        suggestion: rule.suggestion,
                        line: this.getLineNumber(file.code, match.index),
                        snippet: this.extractSnippet(file.code, match.index)
                    });
                    totalStats[rule.severity]++;
                }
            });
            
            this.analysisResults[filename] = issues;
            if (issues.length > 0 || Object.keys(file.code).length > 0) {
                totalStats.files++;
            }
        });
        
        this.updateStats(totalStats);
        
        // If a file is selected, refresh its issues
        if (this.currentFile) {
            this.renderFileIssues(this.currentFile);
        }
        
        // Generate AI suggestions
        this.generateAISuggestions();
    }

    getLineNumber(code, charIndex) {
        const before = code.substring(0, charIndex);
        return before.split('\n').length;
    }

    extractSnippet(code, matchIndex, context = 2) {
        const lines = code.split('\n');
        const lineNum = this.getLineNumber(code, matchIndex) - 1;
        const start = Math.max(0, lineNum - context);
        const end = Math.min(lines.length, lineNum + context + 1);
        return lines.slice(start, end).join('\n');
    }

    renderFileIssues(filename) {
        const issues = this.analysisResults[filename] || [];
        const list = document.getElementById('issues-list');
        document.getElementById('issue-count').textContent = issues.length;
        
        if (issues.length === 0) {
            list.innerHTML = '<div class="text-gray-500 italic">Tidak ada issue ditemukan.</div>';
            return;
        }
        
        list.innerHTML = issues.map(issue => `
            <div class="border-l-4 border-${this.getSeverityColor(issue.severity)} pl-4 py-2 bg-gray-700/50 rounded-r">
                <div class="flex items-start justify-between">
                    <div>
                        <div class="font-semibold text-${this.getSeverityColor(issue.severity)}">
                            ${issue.title}
                            <span class="ml-2 text-xs font-normal text-gray-400">line ${issue.line}</span>
                        </div>
                        <div class="text-sm text-gray-300 mt-1">${issue.message}</div>
                        <div class="text-xs text-gray-500 mt-2 font-mono bg-gray-900 p-2 rounded">
                            <pre>${issue.snippet}</pre>
                        </div>
                    </div>
                    <span class="badge badge-${this.severityToShort(issue.severity)}">${issue.severity.toUpperCase()}</span>
                </div>
                <div class="mt-2 text-sm text-cyan-300">
                    <i class="fas fa-lightbulb mr-1"></i> Saran: ${issue.suggestion}
                </div>
            </div>
        `).join('');
    }

    getSeverityColor(severity) {
        const colors = { critical: 'red-400', high: 'orange-400', medium: 'yellow-400', low: 'purple-400', info: 'blue-400' };
        return colors[severity] || 'gray-400';
    }

    severityToShort(severity) {
        const map = { critical: 'c', high: 'h', medium: 'm', low: 'l', info: 'i' };
        return map[severity] || 'i';
    }

    updateStats(stats) {
        document.getElementById('stat-critical').textContent = stats.critical;
        document.getElementById('stat-high').textContent = stats.high;
        document.getElementById('stat-medium').textContent = stats.medium;
        document.getElementById('stat-low').textContent = stats.low;
        document.getElementById('stat-files').textContent = stats.files;
    }

    generateAISuggestions() {
        const panel = document.getElementById('suggestions-panel');
        const list = document.getElementById('suggestions-list');
        
        // Count issues to generate suggestions
        const totalIssues = Object.values(this.analysisResults).flat().length;
        
        if (totalIssues === 0) {
            panel.classList.add('hidden');
            return;
        }
        
        const suggestions = [
            {
                title: "Gunakan constant untuk nilai magic",
                desc: "Gantikan angka langsung dengan konstanta yang bermakna.",
                icon: "fa-hashtag",
                color: "text-yellow-400"
            },
            {
                title: "Perbaiki error handling",
                desc: "Jangan abaikan nilai error. Selalu cek dan tangani.",
                icon: "fa-exclamation-circle",
                color: "text-red-400"
            },
            {
                title: "Hapus secret dari kode",
                desc: "Pindahkan password/key ke environment variables.",
                icon: "fa-key",
                color: "text-purple-400"
            },
            {
                title: "Validasi input user",
                desc: "Selalu validasi data yang berasal dari user.",
                icon: "fa-shield-alt",
                color: "text-green-400"
            }
        ];
        
        list.innerHTML = suggestions.map(s => `
            <div class="suggestion-card p-4">
                <div class="flex items-center mb-2">
                    <i class="fas ${s.icon} mr-2 ${s.color}"></i>
                    <h4 class="font-semibold">${s.title}</h4>
                </div>
                <p class="text-sm text-gray-400">${s.desc}</p>
            </div>
        `).join('');
        
        panel.classList.remove('hidden');
    }

    copyCode() {
        if (!this.currentFile) return;
        const code = this.project.files[this.currentFile].code;
        navigator.clipboard.writeText(code).then(() => {
            alert('Kode disalin ke clipboard!');
        });
    }
}

// Global
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new CodeReviewDashboard();
});

function runAnalysis() {
    dashboard.runAnalysis();
}

function loadSample() {
    dashboard.loadSample();
}

function copyCode() {
    dashboard.copyCode();
}

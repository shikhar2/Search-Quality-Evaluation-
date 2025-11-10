// Suppress Chrome extension errors in console
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = function (...args) {
    // Filter out Chrome extension errors
    const message = args.join(' ');
    if (message.includes('chrome-extension://') &&
        (message.includes('net::ERR_FILE_NOT_FOUND') ||
            message.includes('net::ERR_ABORTED') ||
            message.includes('net::ERR_FAILED'))) {
        return; // Suppress extension errors
    }
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
};

console.warn = function (...args) {
    // Filter out Chrome extension warnings
    const message = args.join(' ');
    if (message.includes('chrome-extension://')) {
        return; // Suppress extension warnings
    }
    // Call original console.warn for other warnings
    originalConsoleWarn.apply(console, args);
};

// Global error handler for unhandled errors
window.addEventListener('error', function (event) {
    // Suppress extension-related errors
    if (event.filename && event.filename.includes('chrome-extension://')) {
        event.preventDefault();
        return false;
    }
});

// Suppress unhandled promise rejections from extensions
window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    if (reason && (
        (typeof reason === 'string' && reason.includes('chrome-extension://')) ||
        (reason.message && reason.message.includes('chrome-extension://')) ||
        (reason.stack && reason.stack.includes('chrome-extension://'))
    )) {
        event.preventDefault();
    }
});

// Additional suppression for network errors
const originalFetch = window.fetch;
window.fetch = function (...args) {
    return originalFetch.apply(this, args).catch(error => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('chrome-extension://')) {
            // Suppress extension fetch errors
            return Promise.reject(error); // Still reject but don't log
        }
        throw error;
    });
};

// API Configuration
const API_BASE = 'http://127.0.0.1:8000';

// DOM Elements
const singleForm = document.getElementById('singleForm');
const singleResults = document.getElementById('singleResults');
const scoreCircle = document.getElementById('scoreCircle');
const confidenceBar = document.getElementById('confidenceBar');
const confidenceText = document.getElementById('confidenceText');
const reasonCode = document.getElementById('reasonCode');
const aiReasoning = document.getElementById('aiReasoning');
const copySingleResult = document.getElementById('copySingleResult');
const batchInput = document.getElementById('batchInput');
const batchEvaluateBtn = document.getElementById('batchEvaluateBtn');
const batchResults = document.getElementById('batchResults');
const batchResultsList = document.getElementById('batchResultsList');
const batchSearch = document.getElementById('batchSearch');
const scoreFilter = document.getElementById('scoreFilter');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const themeToggle = document.getElementById('themeToggle');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const validateBatchBtn = document.getElementById('validateBatchBtn');

// History Panel Elements
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const toggleHistory = document.getElementById('toggleHistory');
const clearHistory = document.getElementById('clearHistory');
const expandHistoryBtn = document.getElementById('expandHistoryBtn');

// Loading Overlay Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const loadingSubtext = document.getElementById('loadingSubtext');

// Form inputs
const queryInput = document.getElementById('query');
const resultInput = document.getElementById('itemDescription');

// Tab Management
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // Update tab buttons
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(targetTab + 'Tab').classList.add('active');
    });
});

// Global Variables
let currentBatchResults = [];
let evaluationHistory = JSON.parse(localStorage.getItem('evaluationHistory') || '[]');
let batchHistory = JSON.parse(localStorage.getItem('batchHistory') || '[]');
let isHistoryCollapsed = localStorage.getItem('historyCollapsed') === 'true';

// Migrate old batch history data to ensure scores are numbers
batchHistory = batchHistory.map(batch => ({
    ...batch,
    results: batch.results ? batch.results.map(r => ({
        score: parseFloat(r.score) || 0,
        reason: r.reason
    })) : []
}));

let isDarkMode = localStorage.getItem('darkMode') === 'true';

// Loading Management Functions
function showLoading(message = 'Evaluating with AI...', subtext = '') {
    loadingText.textContent = message;
    loadingSubtext.textContent = subtext;
    loadingOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    // Reset text after animation
    setTimeout(() => {
        loadingText.textContent = 'Evaluating with AI...';
        loadingSubtext.textContent = '';
    }, 300);
}

// Health Check
async function checkHealth() {
    const healthStatus = document.getElementById('health-status');

    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
            healthStatus.className = 'status-indicator status-healthy';
            healthStatus.innerHTML = '<i class="fas fa-circle-check"></i>API Healthy';
        }
    } catch (error) {
        healthStatus.className = 'status-indicator status-unhealthy';
        healthStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i>API Offline';
    }
}

// Single Evaluation
singleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    const query = document.getElementById('query').value;
    const title = document.getElementById('itemTitle').value;
    const description = document.getElementById('itemDescription').value;
    const category = document.getElementById('itemCategory').value;
    const attributesValue = document.getElementById('itemAttributes').value;

    // Parse attributes safely - handle both string and object cases
    let attributes = {};
    if (attributesValue && attributesValue.trim()) {
        try {
            // Check if it's already an object (from history loading)
            if (typeof attributesValue === 'object') {
                attributes = attributesValue;
            } else if (attributesValue.trim() === '[object Object]') {
                // Handle the case where an object was assigned to input.value
                attributes = {};
            } else {
                attributes = JSON.parse(attributesValue);
            }
        } catch (e) {
            showToast('Invalid JSON in attributes field.', 'error');
            return;
        }
    }

    const formData = {
        query: query,
        item_title: title,
        item_description: description,
        item_category: category,
        item_attributes: attributes
    };

    showLoading('Evaluating search result...', 'Analyzing relevance with AI...');

    try {
        const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            displaySingleResult(result);
            addToHistory(formData.query, formData, result);
            updateStatistics();
            singleResults.style.display = 'block';
        } else {
            alert('Error: ' + result.detail);
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
});

function displaySingleResult(result) {
    // Map score to quality assessment for color coding
    const qualityAssessments = {
        8: 'EXCELLENT',
        7: 'GOOD',
        6: 'OKAY',
        5: 'INFORMATIONAL',
        4: 'BAD',
        3: 'NONSENSICAL',
        2: 'EMBARRASSING',
        1: 'UTD',
        0: 'PDNL'
    };

    const score = result.relevance_score;
    const qualityText = qualityAssessments[score] || 'UNKNOWN';

    // Display the numeric score
    scoreCircle.textContent = score;

    // Color coding for quality assessment (8=best, 0=worst)
    let color, bgColor;
    if (score >= 7) { // Excellent, Good
        color = '#10b981';
        bgColor = 'rgba(16, 185, 129, 0.1)';
    } else if (score >= 5) { // Okay, Informational
        color = '#f59e0b';
        bgColor = 'rgba(245, 158, 11, 0.1)';
    } else if (score >= 2) { // Bad, Nonsensical, Embarrassing
        color = '#3b82f6';
        bgColor = 'rgba(59, 130, 246, 0.1)';
    } else { // UTD, PDNL
        color = '#ef4444';
        bgColor = 'rgba(239, 68, 68, 0.1)';
    }

    document.querySelector('.metric-icon').style.background = `linear-gradient(135deg, ${color} 0%, ${color} 100%)`;
    confidenceBar.style.width = `${result.confidence * 100}%`;
    confidenceText.textContent = `${(result.confidence * 100).toFixed(1)}%`;
    // Set reason code with proper fallback
    const reasonCodeValue = result.reason_code;
    reasonCode.textContent = (reasonCodeValue !== null && reasonCodeValue !== undefined) ? reasonCodeValue : 'EXCELLENT';

    // Set AI reasoning
    aiReasoning.textContent = result.ai_reasoning || 'No reasoning provided';

    singleResults.style.display = 'block';
    singleResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy to Clipboard with Toast
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    }
}

// Update copy functionality
document.addEventListener('click', (e) => {
    if (e.target.closest('.copy-btn')) {
        const resultCard = e.target.closest('.result-card');
        const resultText = resultCard.querySelector('.result-content').textContent;
        copyToClipboard(resultText);
    }
});

// Copy single result functionality
copySingleResult.addEventListener('click', () => {
    const result = {
        relevance_score: parseInt(scoreCircle.textContent),
        confidence: parseFloat(confidenceText.textContent.replace('%', '')) / 100,
        reason_code: reasonCode.textContent,
        ai_reasoning: aiReasoning.textContent
    };
    const text = `Relevance Score: ${result.relevance_score}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nReason Code: ${result.reason_code}\nAI Reasoning: ${result.ai_reasoning}`;
    copyToClipboard(text);
});

// Toast Notifications
function showToast(message, type = 'info') {
    // Create container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconClass = type === 'success' ? 'check-circle' :
        type === 'error' ? 'exclamation-circle' :
            type === 'warning' ? 'exclamation-triangle' : 'info-circle';

    toast.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
        <span>${message}</span>
        <button class="toast-close" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        removeToast(toast);
    });

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    const autoRemoveTimeout = setTimeout(() => {
        removeToast(toast);
    }, 5000);

    // Store timeout for cleanup
    toast._autoRemoveTimeout = autoRemoveTimeout;
}

function removeToast(toast) {
    // Clear auto-remove timeout
    if (toast._autoRemoveTimeout) {
        clearTimeout(toast._autoRemoveTimeout);
    }

    toast.classList.remove('show');

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);

            // Remove container if empty
            const container = document.querySelector('.toast-container');
            if (container && container.children.length === 0) {
                container.parentNode.removeChild(container);
            }
        }
    }, 300);
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && statsModal.classList.contains('show')) {
        statsModal.classList.remove('show');
    }
});

// Batch Evaluation
batchEvaluateBtn.addEventListener('click', async () => {
    const batchData = batchInput.value.trim();

    if (!batchData) {
        showToast('Please enter batch data.', 'error');
        return;
    }

    try {
        JSON.parse(batchData); // Validate JSON
        await evaluateBatch();
    } catch (e) {
        showToast('Invalid JSON format.', 'error');
    }
});

// Validate batch data
validateBatchBtn.addEventListener('click', () => {
    const rawData = batchInput.value.trim();

    if (!rawData) {
        showToast('Please enter batch data first.', 'warning');
        return;
    }

    try {
        const batchData = JSON.parse(rawData);

        // Validate structure
        if (!Array.isArray(batchData)) {
            showToast('❌ Data must be a JSON array (use square brackets [ ])', 'error');
            return;
        }

        if (batchData.length === 0) {
            showToast('❌ Array cannot be empty', 'error');
            return;
        }

        const requiredFields = ['query', 'item_title', 'item_description', 'item_category'];
        let hasErrors = false;

        for (let i = 0; i < batchData.length; i++) {
            const item = batchData[i];

            if (typeof item !== 'object' || item === null) {
                showToast(`❌ Item ${i + 1}: Must be an object`, 'error');
                hasErrors = true;
                break;
            }

            for (const field of requiredFields) {
                if (!item.hasOwnProperty(field)) {
                    showToast(`❌ Item ${i + 1}: Missing required field "${field}"`, 'error');
                    hasErrors = true;
                    break;
                }
                if (typeof item[field] !== 'string' || item[field].trim() === '') {
                    showToast(`❌ Item ${i + 1}: Field "${field}" must be a non-empty string`, 'error');
                    hasErrors = true;
                    break;
                }
            }

            if (hasErrors) break;

            // Check optional item_attributes
            if (item.item_attributes && typeof item.item_attributes !== 'object') {
                showToast(`❌ Item ${i + 1}: item_attributes must be an object if provided`, 'error');
                hasErrors = true;
                break;
            }

            // Validate that all item_attributes values are strings
            if (item.item_attributes) {
                for (const [key, value] of Object.entries(item.item_attributes)) {
                    if (typeof value !== 'string') {
                        showToast(`❌ Item ${i + 1}: item_attributes["${key}"] must be a string, got ${typeof value}`, 'error');
                        hasErrors = true;
                        break;
                    }
                }
            }
        }

        if (!hasErrors) {
            showToast(`✅ Valid! Found ${batchData.length} item(s) ready for evaluation.`, 'success');
        }

    } catch (e) {
        showToast('❌ Invalid JSON format. Please check your syntax.', 'error');
        console.error('JSON validation error:', e);
    }
});

function displayBatchResults(results, originalData) {
    console.log('Displaying batch results:', { results, originalData });
    console.log('batchResults element:', batchResults);
    console.log('batchResultsList element:', batchResultsList);

    if (!batchResults || !batchResultsList) {
        console.error('Batch results elements not found!');
        return;
    }

    currentBatchResults = results.map((result, index) => ({
        ...result,
        ...originalData[index]
    }));

    console.log('Current batch results:', currentBatchResults);

    batchResultsList.innerHTML = '';

    // Quality assessment mapping
    const qualityAssessments = {
        8: 'EXCELLENT',
        7: 'GOOD',
        6: 'OKAY',
        5: 'INFORMATIONAL',
        4: 'BAD',
        3: 'NONSENSICAL',
        2: 'EMBARRASSING',
        1: 'UTD',
        0: 'PDNL'
    };

    results.forEach((result, index) => {
        const item = originalData[index];
        console.log(`Creating result item ${index}:`, { result, item });

        const itemDiv = document.createElement('div');
        itemDiv.className = 'batch-item';

        const score = result.relevance_score;
        const qualityText = qualityAssessments[score] || 'UNKNOWN';

        // Color coding based on quality assessment (8=best, 0=worst)
        let scoreColor = 'danger'; // default
        if (score >= 7) scoreColor = 'success'; // Excellent, Good
        else if (score >= 5) scoreColor = 'warning'; // Okay, Informational
        else if (score >= 2) scoreColor = 'primary'; // Bad, Nonsensical, Embarrassing

        itemDiv.innerHTML = `
            <div class="batch-item-header">
                <div class="batch-item-content">
                    <div class="batch-item-query">
                        <i class="fas fa-search"></i>
                        "${item.query}"
                    </div>
                    <div class="batch-item-title">
                        <i class="fas fa-tag"></i>
                        ${item.item_title}
                    </div>
                </div>
                <div class="batch-item-score score-${scoreColor}">
                    ${score}
                </div>
            </div>
            <div class="batch-item-meta">
                <span>Confidence: ${(result.confidence * 100).toFixed(1)}%</span>
                <span>Reason: ${result.reason_code || 'EXCELLENT'}</span>
                <span>AI Reasoning: ${result.ai_reasoning || 'N/A'}</span>
            </div>
        `;

        batchResultsList.appendChild(itemDiv);
    });

    console.log('Setting batchResults display to block');
    batchResults.style.display = 'block';

    console.log('Batch results should now be visible');
    console.log('batchResults display style:', batchResults.style.display);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    updateStatistics();
    // Check health every 30 seconds
    setInterval(checkHealth, 30000);
});

// Theme Management
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);

    // Add rotation animation
    themeToggle.classList.add('rotating');
    setTimeout(() => {
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggle.classList.remove('rotating');
    }, 250); // Half the animation duration

    localStorage.setItem('darkMode', isDarkMode);
}

function applyTheme() {
    document.body.classList.toggle('dark-mode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Theme Toggle
themeToggle.addEventListener('click', toggleTheme);

// Initialize theme on load
applyTheme();

// History Management
function addToHistory(query, item, result) {
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        query: query,
        itemTitle: item.title || item.item_title,
        itemDescription: item.description || item.item_description,
        itemCategory: item.category || item.item_category,
        itemAttributes: item.attributes || item.item_attributes,
        score: result.relevance_score,
        confidence: result.confidence,
        reason: result.reason_code
    };

    evaluationHistory.unshift(historyItem);
    if (evaluationHistory.length > 50) evaluationHistory = evaluationHistory.slice(0, 50);

    localStorage.setItem('evaluationHistory', JSON.stringify(evaluationHistory));
    updateHistoryDisplay();
    updateStatistics();
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';

    // Quality assessment mapping
    const qualityAssessments = {
        8: 'EXCELLENT',
        7: 'GOOD',
        6: 'OKAY',
        5: 'INFORMATIONAL',
        4: 'BAD',
        3: 'NONSENSICAL',
        2: 'EMBARRASSING',
        1: 'UTD',
        0: 'PDNL'
    };

    evaluationHistory.slice(0, 10).forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.onclick = () => loadFromHistory(item);

        const score = item.score;
        const qualityText = qualityAssessments[score] || 'UNKNOWN';

        // Color coding based on quality assessment (8=best, 0=worst)
        let scoreClass = 'danger'; // default
        if (score >= 7) scoreClass = 'success'; // Excellent, Good
        else if (score >= 5) scoreClass = 'warning'; // Okay, Informational
        else if (score >= 2) scoreClass = 'primary'; // Bad, Nonsensical, Embarrassing

        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <small class="text-muted">${item.timestamp}</small>
                    <div class="fw-bold">${item.query}</div>
                    <small>${item.itemTitle}</small>
                </div>
                <span class="badge bg-${scoreClass}">${score}</span>
            </div>
        `;

        historyList.appendChild(div);
    });

    // Show panel if there's history, but respect collapsed state
    if (evaluationHistory.length > 0) {
        historyPanel.style.display = 'block';
        if (isHistoryCollapsed) {
            historyPanel.classList.add('collapsed');
            toggleHistory.classList.add('rotated');
            expandHistoryBtn.classList.add('show');
        } else {
            historyPanel.classList.remove('collapsed');
            toggleHistory.classList.remove('rotated');
            expandHistoryBtn.classList.remove('show');
        }
    } else {
        historyPanel.style.display = 'none';
        expandHistoryBtn.classList.remove('show');
    }
}

function loadFromHistory(item) {
    document.getElementById('query').value = item.query;
    document.getElementById('itemTitle').value = item.itemTitle;
    document.getElementById('itemDescription').value = item.itemDescription || '';
    document.getElementById('itemCategory').value = item.itemCategory || '';

    // Handle itemAttributes - ensure it's a JSON string for the input field
    let attributesValue = '{}';
    if (item.itemAttributes) {
        if (typeof item.itemAttributes === 'string') {
            attributesValue = item.itemAttributes;
        } else {
            // It's an object, convert to JSON string
            attributesValue = JSON.stringify(item.itemAttributes, null, 2);
        }
    }
    document.getElementById('itemAttributes').value = attributesValue;

    // Switch to single tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="single"]').classList.add('active');
    document.getElementById('singleTab').classList.add('active');

    showToast('Loaded from history', 'info');
}

function toggleHistoryPanel() {
    isHistoryCollapsed = !isHistoryCollapsed;
    localStorage.setItem('historyCollapsed', isHistoryCollapsed);

    if (isHistoryCollapsed) {
        historyPanel.classList.add('collapsed');
        toggleHistory.classList.add('rotated');
        expandHistoryBtn.classList.add('show');
    } else {
        historyPanel.classList.remove('collapsed');
        toggleHistory.classList.remove('rotated');
        expandHistoryBtn.classList.remove('show');
    }
}

function expandHistoryPanel() {
    isHistoryCollapsed = false;
    localStorage.setItem('historyCollapsed', isHistoryCollapsed);

    historyPanel.classList.remove('collapsed');
    toggleHistory.classList.remove('rotated');
    expandHistoryBtn.classList.remove('show');
}

function clearEvaluationHistory() {
    if (confirm('Are you sure you want to clear all evaluation history?')) {
        evaluationHistory = [];
        localStorage.setItem('evaluationHistory', JSON.stringify(evaluationHistory));
        updateHistoryDisplay();
    }
}

// Statistics with animations
let previousStats = {
    total: 0,
    average: 0,
    excellent: 0,
    good: 0,
    poor: 0
};

function updateStatistics() {
    const total = evaluationHistory.length;
    const scores = evaluationHistory.map(h => h.score);
    const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

    // Update quality assessment counts
    const pdnl = scores.filter(s => s === 0).length;
    const utd = scores.filter(s => s === 1).length;
    const embarrassing = scores.filter(s => s === 2).length;
    const nonsensical = scores.filter(s => s === 3).length;
    const bad = scores.filter(s => s === 4).length;
    const informational = scores.filter(s => s === 5).length;
    const okay = scores.filter(s => s === 6).length;
    const good = scores.filter(s => s === 7).length;
    const excellent = scores.filter(s => s === 8).length;

    // Update global stats (for any remaining references)
    animateCounter('totalEvaluations', previousStats.total, total);
    animateCounter('averageScore', previousStats.average, parseFloat(average));
    animateCounter('excellentCount', previousStats.excellent, excellent);
    animateCounter('goodCount', previousStats.good, good);
    animateCounter('poorCount', previousStats.poor, bad + nonsensical); // Combine poor categories

    // Update trends
    updateTrend('totalTrend', total - previousStats.total);
    updateTrend('averageTrend', parseFloat(average) - previousStats.average);

    // Update progress bars with new categories (8=best, 0=worst)
    const totalScores = scores.length;
    if (totalScores > 0) {
        animateProgress('excellentProgress', ((excellent + good) / totalScores) * 100); // EXCELLENT + GOOD
        animateProgress('goodProgress', ((okay + informational) / totalScores) * 100); // OKAY + INFORMATIONAL
        animateProgress('poorProgress', ((bad + nonsensical + embarrassing + utd + pdnl) / totalScores) * 100); // BAD + NONSENSICAL + EMBARRASSING + UTD + PDNL
    }

    // Update tab-specific stats
    updateTabStatistics();

    // Store previous values
    previousStats = { total, average: parseFloat(average), excellent, good, poor: bad + nonsensical + embarrassing };
}

function updateTabStatistics() {
    const total = evaluationHistory.length;
    const scores = evaluationHistory.map(h => h.score);
    const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const lastScore = evaluationHistory.length > 0 ? evaluationHistory[evaluationHistory.length - 1].score : '-';

    // Single tab stats
    animateCounter('singleTotal', 0, total); // Always show total evaluations
    animateCounter('singleAvgScore', 0, parseFloat(average));
    document.getElementById('singleLastScore').textContent = lastScore;

    // Batch tab stats (for now, showing same data - can be customized later)
    const batchCount = batchHistory.length;
    const completedBatches = batchHistory.filter(b => b.status === 'completed').length;
    const batchScores = batchHistory.flatMap(b => b.results ? b.results.map(r => parseFloat(r.score) || 0).filter(score => !isNaN(score)) : []);
    const batchAverage = batchScores.length > 0 ? (batchScores.reduce((a, b) => a + b, 0) / batchScores.length).toFixed(1) : '0.0';

    animateCounter('batchTotal', 0, batchCount);
    animateCounter('batchCompleted', 0, completedBatches);
    animateCounter('batchAvgScore', 0, parseFloat(batchAverage) || 0);
}

function animateCounter(elementId, from, to) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.add('updating');

    const duration = 1000;
    const start = Date.now();
    const isFloat = typeof to === 'number' && to % 1 !== 0;

    function update() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = from + (to - from) * progress;

        if (isFloat) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.round(current);
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.classList.remove('updating');
        }
    }

    update();
}

function updateTrend(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.remove('positive', 'negative');

    if (change > 0) {
        element.classList.add('positive');
        element.innerHTML = `<i class="fas fa-arrow-up"></i><span>+${change.toFixed(1)}</span>`;
    } else if (change < 0) {
        element.classList.add('negative');
        element.innerHTML = `<i class="fas fa-arrow-down"></i><span>${change.toFixed(1)}</span>`;
    } else {
        element.innerHTML = `<i class="fas fa-minus"></i><span>0.0</span>`;
    }
}

function animateProgress(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (!element) return;

    setTimeout(() => {
        element.style.width = `${percentage}%`;
    }, 100);
}

// Export Functions
function exportToJson() {
    if (currentBatchResults.length === 0) {
        showToast('No results to export', 'error');
        return;
    }

    const dataStr = JSON.stringify(currentBatchResults, null, 2);
    downloadFile(dataStr, 'evaluation_results.json', 'application/json');
    showToast('JSON exported successfully!', 'success');
}

function exportToCsv() {
    if (currentBatchResults.length === 0) {
        showToast('No results to export', 'error');
        return;
    }

    const headers = ['Query', 'Item Title', 'Item Description', 'Category', 'Score', 'Confidence', 'Reason Code'];
    const rows = currentBatchResults.map(result => [
        result.query,
        result.item_title,
        result.item_description,
        result.item_category,
        result.relevance_score,
        (result.confidence * 100).toFixed(1) + '%',
        result.reason_code || 'EXCELLENT'
    ]);

    const csvContent = [headers, ...rows].map(row =>
        row.map(field => `"${field}"`).join(',')
    ).join('\n');

    downloadFile(csvContent, 'evaluation_results.csv', 'text/csv');
    showToast('CSV exported successfully!', 'success');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Search and Filter
function filterBatchResults() {
    const searchTerm = batchSearch.value.toLowerCase();
    const scoreFilterValue = scoreFilter.value;

    const filteredResults = currentBatchResults.filter((result, index) => {
        const matchesSearch = !searchTerm ||
            result.query.toLowerCase().includes(searchTerm) ||
            result.item_title.toLowerCase().includes(searchTerm) ||
            result.item_description.toLowerCase().includes(searchTerm);

        let matchesScore = true;
        if (scoreFilterValue) {
            const score = result.relevance_score;
            switch (scoreFilterValue) {
                case 'excellent': matchesScore = score === 8; break; // EXCELLENT
                case 'good': matchesScore = score === 7; break; // GOOD
                case 'okay': matchesScore = score === 6; break; // OKAY
                case 'informational': matchesScore = score === 5; break; // INFORMATIONAL
                case 'bad': matchesScore = score === 4; break; // BAD
                case 'nonsensical': matchesScore = score === 3; break; // NONSENSICAL
                case 'embarrassing': matchesScore = score === 2; break; // EMBARRASSING
                case 'utd': matchesScore = score === 1; break; // UTD
                case 'pdnl': matchesScore = score === 0; break; // PDNL
            }
        }

        return matchesSearch && matchesScore;
    });

    displayFilteredBatchResults(filteredResults);
}

function displayFilteredBatchResults(results) {
    batchResultsList.innerHTML = '';

    if (results.length === 0) {
        batchResultsList.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No results found</p></div>';
        return;
    }

    // Quality assessment mapping
    const qualityAssessments = {
        8: 'EXCELLENT',
        7: 'GOOD',
        6: 'OKAY',
        5: 'INFORMATIONAL',
        4: 'BAD',
        3: 'NONSENSICAL',
        2: 'EMBARRASSING',
        1: 'UTD',
        0: 'PDNL'
    };

    results.forEach((result, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'batch-item';

        const score = result.relevance_score;
        const qualityText = qualityAssessments[score] || 'UNKNOWN';

        // Color coding based on quality assessment (8=best, 0=worst)
        let scoreClass = 'danger'; // default
        if (score >= 7) scoreClass = 'success'; // Excellent, Good
        else if (score >= 5) scoreClass = 'warning'; // Okay, Informational
        else if (score >= 2) scoreClass = 'primary'; // Bad, Nonsensical, Embarrassing

        itemDiv.classList.add(scoreClass);

        itemDiv.innerHTML = `
            <div class="batch-item-header">
                <div>
                    <div class="batch-item-title">${result.item_title}</div>
                    <div class="batch-item-query">"${result.query}"</div>
                </div>
                <div class="batch-item-score">${score}</div>
            </div>
            <div class="batch-item-meta">
                <span>Confidence: ${(result.confidence * 100).toFixed(1)}%</span>
                <span>Reason: ${result.reason_code || 'EXCELLENT'}</span>
                <button class="btn-secondary btn-sm" onclick="copyBatchResult(${index})">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;

        itemDiv.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                loadFromBatchResult(result);
            }
        });

        batchResultsList.appendChild(itemDiv);
    });
}

// Copy batch result
function copyBatchResult(index) {
    const result = currentBatchResults[index];
    const text = `Query: "${result.query}"\nItem: ${result.item_title}\nScore: ${result.relevance_score}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nReason: ${result.reason_code || 'EXCELLENT'}`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Result copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy result', 'error');
    });
}

// Load from batch result
function loadFromBatchResult(result) {
    document.getElementById('query').value = result.query;
    document.getElementById('itemTitle').value = result.item_title;
    document.getElementById('itemDescription').value = result.item_description;
    document.getElementById('itemCategory').value = result.item_category;
    document.getElementById('itemAttributes').value = JSON.stringify(result.item_attributes, null, 2);

    // Switch to single tab
    document.querySelector('[data-tab="single"]').click();
    document.getElementById('query').scrollIntoView({ behavior: 'smooth' });
}

// Load sample data
loadSampleBtn.addEventListener('click', () => {
    const sampleData = [
        {
            "query": "red running shoes",
            "item_title": "Nike Air Zoom Pegasus 39",
            "item_description": "Experience ultimate comfort and performance with these vibrant red running shoes. Featuring advanced Zoom Air technology for responsive cushioning, breathable mesh upper, and durable rubber outsole for excellent traction on various surfaces.",
            "item_category": "Footwear",
            "item_attributes": {
                "color": "red",
                "size": "9",
                "brand": "Nike",
                "price": "$129.99"
            }
        },
        {
            "query": "wireless bluetooth headphones",
            "item_title": "Sony WH-1000XM4",
            "item_description": "Premium wireless noise-canceling headphones with 30-hour battery life, quick charge, and crystal clear sound quality. Perfect for travel, work, and entertainment.",
            "item_category": "Electronics",
            "item_attributes": {
                "color": "black",
                "battery_life": "30 hours",
                "noise_cancelling": "true",
                "price": "$349.99"
            }
        }
    ];

    batchInput.value = JSON.stringify(sampleData, null, 2);
    showToast('Sample data loaded!', 'info');
});

// Enhanced form validation
function validateForm() {
    const query = queryInput.value.trim();
    const result = resultInput.value.trim();

    if (!query) {
        showToast('Please enter a search query.', 'error');
        queryInput.focus();
        return false;
    }

    if (!result) {
        showToast('Please enter item description.', 'error');
        resultInput.focus();
        return false;
    }

    return true;
}

// Evaluation Functions
async function evaluateSingle() {
    const query = queryInput.value.trim();
    const title = document.getElementById('itemTitle').value.trim();
    const description = resultInput.value.trim();
    const category = document.getElementById('itemCategory').value.trim();
    const attributesValue = document.getElementById('itemAttributes').value.trim();

    // Parse attributes safely - handle both string and object cases
    let attributes = {};
    if (attributesValue && attributesValue.trim()) {
        try {
            // Check if it's already an object (from history loading)
            if (typeof attributesValue === 'object') {
                attributes = attributesValue;
            } else if (attributesValue.trim() === '[object Object]') {
                // Handle the case where an object was assigned to input.value
                attributes = {};
            } else {
                attributes = JSON.parse(attributesValue);
            }
        } catch (e) {
            showToast('Invalid JSON in attributes field.', 'error');
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                item_title: title,
                item_description: description,
                item_category: category,
                item_attributes: attributes
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displaySingleResult(result);

        // Add to history
        addToHistory(query, { title, description, category, attributes }, result);

        // showToast('Evaluation completed!', 'success'); // Removed - handled by loading hide
    } catch (error) {
        console.error('Evaluation error:', error);
        showToast('Evaluation failed. Please try again.', 'error');
    }
}

async function evaluateBatch() {
    try {
        const rawBatchData = batchInput.value.trim();

        // Debug: Log the raw input
        console.log('Raw batch input:', rawBatchData);

        if (!rawBatchData) {
            showToast('Please enter batch data.', 'error');
            return;
        }

        let batchData;
        try {
            batchData = JSON.parse(rawBatchData);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            showToast('Invalid JSON format. Please check your data structure.', 'error');
            return;
        }

        // Debug: Log the parsed data
        console.log('Parsed batch data:', batchData);

        // Validate that it's an array
        if (!Array.isArray(batchData)) {
            showToast('Batch data must be a JSON array of evaluation objects.', 'error');
            return;
        }

        // Validate each item in the array
        for (let i = 0; i < batchData.length; i++) {
            const item = batchData[i];
            const requiredFields = ['query', 'item_title', 'item_description', 'item_category'];

            for (const field of requiredFields) {
                if (!item[field] || typeof item[field] !== 'string' || item[field].trim() === '') {
                    showToast(`Item ${i + 1}: Missing or invalid required field "${field}".`, 'error');
                    return;
                }
            }

            // Validate item_attributes if present
            if (item.item_attributes && typeof item.item_attributes !== 'object') {
                showToast(`Item ${i + 1}: item_attributes must be an object.`, 'error');
                return;
            }
        }

        // Debug: Log the final request payload
        const requestPayload = { evaluations: batchData };
        console.log('Request payload:', requestPayload);

        const response = await fetch(`${API_BASE}/evaluate/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('Server response:', result);

        displayBatchResults(result.results, batchData);

        // Save batch to history
        const batchRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            totalItems: batchData.length,
            status: 'completed',
            averageScore: result.results.length > 0 ?
                (result.results.reduce((sum, item) => sum + (parseFloat(item.score) || 0), 0) / result.results.length).toFixed(1) : '0.0',
            results: result.results.map(r => ({
                score: parseFloat(r.score) || 0,
                reason: r.reason_code
            }))
        };

        batchHistory.unshift(batchRecord); // Add to beginning of array

        // Keep only last 50 batches to prevent localStorage bloat
        if (batchHistory.length > 50) {
            batchHistory = batchHistory.slice(0, 50);
        }

        localStorage.setItem('batchHistory', JSON.stringify(batchHistory));

        // Update statistics after saving
        updateTabStatistics();

        // showToast('Batch evaluation completed!', 'success'); // Removed - handled by loading hide
    } catch (error) {
        console.error('Batch evaluation error:', error);
        showToast(`Batch evaluation failed: ${error.message}`, 'error');
    }
}

// Batch evaluation
batchEvaluateBtn.addEventListener('click', async () => {
    const batchData = batchInput.value.trim();

    if (!batchData) {
        showToast('Please enter batch data.', 'error');
        return;
    }

    try {
        const parsedData = JSON.parse(batchData); // Validate JSON
        showLoading('Processing batch evaluation...', `Evaluating ${parsedData.length} items with AI...`);
        await evaluateBatch();
    } catch (e) {
        showToast('Invalid JSON format.', 'error');
    } finally {
        hideLoading();
    }
});

// Event listeners for batch functionality
if (batchSearch) {
    batchSearch.addEventListener('input', filterBatchResults);
}

if (scoreFilter) {
    scoreFilter.addEventListener('change', filterBatchResults);
}

if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportToJson);
}

if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCsv);
}

// History functionality
if (clearHistory) {
    clearHistory.addEventListener('click', clearEvaluationHistory);
}

if (toggleHistory) {
    toggleHistory.addEventListener('click', toggleHistoryPanel);
}

if (expandHistoryBtn) {
    expandHistoryBtn.addEventListener('click', expandHistoryPanel);
}

// Initialize statistics and history on page load
updateStatistics();
updateHistoryDisplay();
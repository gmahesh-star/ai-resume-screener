document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const fileUpload = document.getElementById('resume-upload');
    const fileList = document.getElementById('file-list');
    const analyzeBtn = document.getElementById('analyze-btn');
    const clearBtn = document.getElementById('clear-btn');
    const jobDescription = document.getElementById('job-description');
    const charCount = document.getElementById('char-count');
    const dropZone = document.getElementById('drop-zone');
    const uploadLabel = document.getElementById('upload-label');
    const navbar = document.getElementById('navbar');

    // Sections
    const resultsSection = document.getElementById('results-section');
    const loadingUI = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const historySection = document.getElementById('history-section');
    const historyContainer = document.getElementById('history-container');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Nav links
    const navUpload = document.getElementById('nav-upload');
    const navResults = document.getElementById('nav-results');
    const navHistory = document.getElementById('nav-history');

    // Stats
    const statResumes = document.getElementById('stat-resumes');

    // Loading steps
    const steps = ['step-extract', 'step-parse', 'step-match', 'step-rank'];

    // The backend API address
    const API_URL = 'http://127.0.0.1:8000';

    let selectedFiles = [];
    let totalAnalyzed = parseInt(localStorage.getItem('totalAnalyzed') || '0');

    // --- Initialize ---
    updateStatCounter();

    // --- Toast System ---
    function createToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(message, type = 'success') {
        const container = createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('exiting');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // --- Navbar Scroll Effect ---
    // Throttled scroll listener
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 40) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    // --- Nav Link Click ---
    navUpload.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
        setActiveNav(navUpload);
    });

    navResults.addEventListener('click', (e) => {
        e.preventDefault();
        if (resultsSection.classList.contains('section-hidden')) {
            showToast('Run an analysis first to see results', 'info');
            return;
        }
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        setActiveNav(navResults);
    });

    navHistory.addEventListener('click', (e) => {
        e.preventDefault();
        historySection.classList.remove('section-hidden');
        historySection.classList.add('section-visible');
        loadHistory();
        setTimeout(() => {
            historySection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        setActiveNav(navHistory);
    });

    function setActiveNav(activeLink) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        activeLink.classList.add('active');
    }

    // --- Character Counter ---
    jobDescription.addEventListener('input', () => {
        charCount.textContent = jobDescription.value.length;
    });

    // --- Drag & Drop ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            uploadLabel.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            uploadLabel.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
            f.name.endsWith('.pdf') || f.name.endsWith('.docx')
        );
        if (droppedFiles.length === 0) {
            showToast('Only .pdf and .docx files are supported', 'error');
            return;
        }
        selectedFiles = [...selectedFiles, ...droppedFiles];
        renderFileList();
        showToast(`${droppedFiles.length} file(s) added`, 'success');
    });

    // --- Handle file selection ---
    fileUpload.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        selectedFiles = [...selectedFiles, ...newFiles];
        renderFileList();
        if (newFiles.length > 0) {
            showToast(`${newFiles.length} file(s) selected`, 'success');
        }
    });

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function getFileIcon(filename) {
        if (filename.endsWith('.pdf')) return '📄';
        if (filename.endsWith('.docx')) return '📝';
        return '📎';
    }

    function renderFileList() {
        fileList.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.style.animationDelay = `${index * 0.05}s`;
            fileItem.innerHTML = `
                <div class="file-item-info">
                    <div class="file-item-icon">${getFileIcon(file.name)}</div>
                    <div>
                        <div class="file-item-name">${file.name}</div>
                        <div class="file-item-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove-btn" data-index="${index}" title="Remove file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
            fileList.appendChild(fileItem);
        });

        // Attach remove handlers
        document.querySelectorAll('.file-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                selectedFiles.splice(idx, 1);
                renderFileList();
            });
        });
    }

    // --- Clear All ---
    clearBtn.addEventListener('click', () => {
        selectedFiles = [];
        fileUpload.value = '';
        jobDescription.value = '';
        charCount.textContent = '0';
        renderFileList();
        
        resultsSection.classList.add('section-hidden');
        resultsSection.classList.remove('section-visible');
        
        resultsContainer.innerHTML = '';
        showToast('Everything cleared', 'success');
    });

    // --- Analyze ---
    analyzeBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const jd = jobDescription.value.trim();
        if (!jd || jd.length < 10) {
            showToast('Please enter a valid job description (min 10 characters)', 'error');
            jobDescription.focus();
            return;
        }

        if (selectedFiles.length === 0) {
            showToast('Please upload at least one resume file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('job_description', jd);
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // Show loading state
        resultsSection.classList.remove('section-hidden');
        // Small delay to allow display change to take effect before transition
        requestAnimationFrame(() => {
            resultsSection.classList.add('section-visible');
        });
        
        loadingUI.style.display = 'block';
        resultsContainer.innerHTML = '';
        analyzeBtn.disabled = true;

        // Animate loading steps
        animateLoadingSteps();

        // Scroll to loading
        setTimeout(() => {
            loadingUI.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        try {
            console.log("Sending request to backend...");
            const response = await fetch(`${API_URL}/upload-resume`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log("Backend response received:", data);

            // Complete all loading steps
            completeAllLoadingSteps();

            if (response.ok && data.status === 'success') {
                // Small delay for visual effect
                await delay(600);
                loadingUI.style.display = 'none';
                renderResults(data.results);
                setActiveNav(navResults);

                // Update stats
                totalAnalyzed += selectedFiles.length;
                localStorage.setItem('totalAnalyzed', totalAnalyzed.toString());
                updateStatCounter();

                showToast(`Analysis complete — ${data.results.length} candidate(s) ranked!`, 'success');
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error(data.detail || 'An error occurred during analysis.');
            }

        } catch (error) {
            console.error('Error in request:', error);
            loadingUI.style.display = 'none';
            resultsContainer.innerHTML = `
                <div class="result-card error-card" style="animation-delay: 0s; opacity: 1;">
                    <div class="error-msg">
                        <strong>🛑 Error:</strong> ${error.message}<br><br>
                        Make sure the backend server is running at ${API_URL}. Try: <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;">uvicorn backend.main:app --reload</code>
                    </div>
                </div>
            `;
            showToast('Analysis failed — check console for details', 'error');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        } finally {
            analyzeBtn.disabled = false;
            resetLoadingSteps();
        }
    });

    // --- Loading Steps Animation ---
    function animateLoadingSteps() {
        resetLoadingSteps();
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep > 0) {
                const prevEl = document.getElementById(steps[currentStep - 1]);
                if (prevEl) {
                    prevEl.classList.remove('active');
                    prevEl.classList.add('done');
                }
            }
            if (currentStep < steps.length) {
                const el = document.getElementById(steps[currentStep]);
                if (el) el.classList.add('active');
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 800);
    }

    function completeAllLoadingSteps() {
        steps.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
                el.classList.add('done');
            }
        });
    }

    function resetLoadingSteps() {
        steps.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active', 'done');
            }
        });
    }

    // --- Render Results ---
    async function renderResults(results) {
        resultsContainer.innerHTML = '';

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="result-card" style="opacity: 1; text-align: center; padding: 40px;">
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">⚠️ No results found or files could not be parsed.</p>
                </div>
            `;
            return;
        }

        for (let index = 0; index < results.length; index++) {
            const res = results[index];
            const card = document.createElement('div');
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            card.className = `result-card ${rankClass}`;
            
            // Staggered appearance using delay and requestAnimationFrame
            await delay(100); 

            if (res.error) {
                renderErrorCard(card, res, index);
            } else {
                renderSuccessCard(card, res, index);
            }
            
            resultsContainer.appendChild(card);
            
            // Trigger animation
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }

        // Animate score bars after cards are in
        setTimeout(() => {
            document.querySelectorAll('.score-bar').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 500);
    }

    function renderErrorCard(card, res, index) {
        card.classList.add('error-card');
        card.innerHTML = `
            <div class="result-header">
                <div class="result-header-left">
                    <div class="rank-badge">#${index + 1}</div>
                    <div>
                        <div class="candidate-name">${sanitize(res.filename)}</div>
                    </div>
                </div>
            </div>
            <div class="error-msg">⚠️ Analysis Error: ${sanitize(res.error)}</div>
        `;
    }

    function renderSuccessCard(card, res, index) {
        const score = res.score || 0;
        const scoreClass = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
        const scoreColorClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low';

        const matchedHtml = (res.matched_skills || []).map(s =>
            `<span class="badge badge-matched">${sanitize(s)}</span>`
        ).join('');

        const missingHtml = (res.missing_skills || []).map(s =>
            `<span class="badge badge-missing">${sanitize(s)}</span>`
        ).join('');

        const suggestion = generateSuggestion(score, res.matched_skills, res.missing_skills);

        card.innerHTML = `
            <div class="result-header">
                <div class="result-header-left">
                    <div class="rank-badge">#${index + 1}</div>
                    <div>
                        <div class="candidate-name">${sanitize(res.filename.replace(/\.(pdf|docx)$/i, ''))}</div>
                        <div class="candidate-file">${sanitize(res.filename)}</div>
                    </div>
                </div>
                <div class="score-wrapper">
                    <div class="match-score ${scoreColorClass}">${score}%</div>
                    <div class="score-label">match score</div>
                </div>
            </div>

            <div class="score-bar-container">
                <div class="score-bar ${scoreClass}" style="width: 0%;" data-target="${score}"></div>
            </div>

            <div class="skills-grid">
                <div class="skill-column">
                    <div class="skill-label matched">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Matched Skills (${(res.matched_skills || []).length})
                    </div>
                    <div class="badges">
                        ${matchedHtml || '<span class="badge badge-none">None detected</span>'}
                    </div>
                </div>
                <div class="skill-column">
                    <div class="skill-label missing">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Missing Skills (${(res.missing_skills || []).length})
                    </div>
                    <div class="badges">
                        ${missingHtml || '<span class="badge badge-none">None</span>'}
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <div class="suggestions-section">
                    <div class="suggestion-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        AI Insight
                    </div>
                    <div class="suggestion-text">${suggestion}</div>
                </div>
                <button class="icon-btn copy-btn" data-filename="${sanitize(res.filename)}" data-score="${score}" title="Copy Result">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
            </div>
        `;

        // Attach copy listener
        setTimeout(() => {
            const btn = card.querySelector('.copy-btn');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = `Candidate: ${res.filename}\nMatch Score: ${score}%\nMatched: ${res.matched_skills.join(', ')}\nMissing: ${res.missing_skills.join(', ')}`;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Copied to clipboard!', 'success');
                });
            });
        }, 0);
    }

    // --- Generate Suggestion ---
    function generateSuggestion(score, matched, missing) {
        const matchedCount = (matched || []).length;
        const missingCount = (missing || []).length;

        if (score >= 80) {
            return `Strong candidate! Covers ${matchedCount} key skill${matchedCount !== 1 ? 's' : ''}. ${missingCount > 0 ? `Consider verifying experience in: ${missing.slice(0, 3).join(', ')}.` : 'Excellent overall match.'}`;
        } else if (score >= 60) {
            return `Good potential match with room for growth. ${missingCount > 0 ? `Key gaps: ${missing.slice(0, 3).join(', ')}. These could be addressed through training.` : ''}`;
        } else if (score >= 40) {
            return `Partial match. The candidate shows some relevant skills but ${missingCount > 0 ? `is missing critical requirements like ${missing.slice(0, 3).join(', ')}.` : 'may need further evaluation.'}`;
        } else {
            return `Low match score. ${missingCount > 0 ? `Significant skill gaps including ${missing.slice(0, 3).join(', ')}.` : ''} May not be suitable for this role.`;
        }
    }

    // --- Sanitize HTML ---
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Update Stats Counter ---
    function updateStatCounter() {
        if (statResumes) {
            animateCounter(statResumes, totalAnalyzed);
        }
    }

    function animateCounter(el, target) {
        const duration = 800;
        const start = parseInt(el.textContent) || 0;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }

    // --- History ---
    function loadHistory() {
        if (!historyContainer) return;

        fetch(`${API_URL}/results`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.results && data.results.length > 0) {
                    historyContainer.innerHTML = data.results.map((r, i) => `
                        <div class="file-item" style="animation-delay: ${i * 0.05}s;">
                            <div class="file-item-info">
                                <div class="file-item-icon">📊</div>
                                <div>
                                    <div class="file-item-name">${sanitize(r.filename || 'Unknown')}</div>
                                    <div class="file-item-size">Score: ${r.match_score || 0}% • ${r.status || 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                } else {
                    historyContainer.innerHTML = `
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <p>No history yet. Run your first analysis above!</p>
                        </div>
                    `;
                }
            })
            .catch(() => {
                historyContainer.innerHTML = `
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p>Could not load history. Make sure the backend is running.</p>
                    </div>
                `;
            });
    }

    // --- Clear History ---
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            fetch(`${API_URL}/results`, { method: 'DELETE' })
                .then(res => res.json())
                .then(() => {
                    showToast('History cleared', 'success');
                    loadHistory();
                })
                .catch(() => showToast('Failed to clear history', 'error'));
        });
    }

    // --- Chatbot Logic ---
    const chatFab = document.getElementById('chat-fab');
    const chatWindow = document.getElementById('chat-window');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatSuggestions = document.getElementById('chat-suggestions');

    // Toggle Chat Window
    chatFab.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        chatFab.classList.toggle('window-open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
            if (chatSuggestions.children.length === 0) {
                loadSuggestions();
            }
        }
    });

    chatCloseBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        chatFab.classList.remove('window-open');
    });

    // Close chat when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
            chatWindow.classList.remove('open');
            chatFab.classList.remove('window-open');
        }
    });

    // Send Message
    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    function appendMessage(text, sender, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        
        if (isHtml) {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.textContent = text;
        }
        
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        chatMessages.appendChild(indicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to UI
        appendMessage(message, 'user');
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();

        // Get latest context (if any)
        let context = {};
        if (historyContainer && historyContainer.children.length > 0 && !historyContainer.querySelector('.empty-state')) {
            // We just grab the first row for now as local context
            // Could be improved to track actual current session results
            try {
                const resultsResp = await fetch(`${API_URL}/results`);
                const data = await resultsResp.json();
                if (data.status === 'success' && data.results) {
                     context = { results: data.results.slice(0, 3) }; // Send top 3 results
                }
            } catch (e) {
                console.error("Failed to get context", e);
            }
        }

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, context: context })
            });

            const data = await response.json();
            
            removeTypingIndicator();

            if (response.ok && data.status === 'success') {
                // Parse markdown-like bold syntax to HTML
                let formattedReply = escapeHtml(data.reply);
                formattedReply = formattedReply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                appendMessage(formattedReply, 'bot', true);
            } else {
                appendMessage("Sorry, I encountered an error connecting to the server.", 'bot');
            }
        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator();
            appendMessage("Sorry, I couldn't reach the server right now. Is the backend running?", 'bot');
        }
    }

    // Load suggested questions
    async function loadSuggestions() {
        try {
            const response = await fetch(`${API_URL}/chat/suggestions`);
            const data = await response.json();
            
            if (response.ok && data.status === 'success' && data.suggestions) {
                chatSuggestions.innerHTML = '';
                data.suggestions.forEach(question => {
                    const chip = document.createElement('div');
                    chip.className = 'suggestion-chip';
                    chip.textContent = question;
                    chip.addEventListener('click', () => {
                        chatInput.value = question;
                        sendMessage();
                        // Hide suggestions after one is clicked
                        chatSuggestions.style.display = 'none';
                    });
                    chatSuggestions.appendChild(chip);
                });
            }
        } catch (error) {
            console.error('Failed to load suggestions:', error);
        }
    }

    // --- Utility ---
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});

/**
 * LearnIQ - teacher-view-subject.js
 * Safe declaration controller to prevent redeclaration SyntaxErrors.
 * Resolves: "Uncaught SyntaxError: Identifier 'apiService' has already been declared"
 */

// 1. SAFE RESOLUTION OF GLOBAL INSTANCE:
// Instead of declaring "const apiService" which may conflict with ApiService.js declarations,
// we safely check if a global apiService instance already exists, or create one if missing.
if (typeof window.apiService === 'undefined') {
    // Falls back to initializing from the class in ApiService.js
    if (typeof ApiService !== 'undefined') {
        window.apiService = new ApiService();
    } else {
        console.error("CRITICAL ERROR: ApiService class definition is missing from the global scope!");
    }
}

// Keep a local reference that won't conflict at global block scope
const currentApiService = window.apiService;

// State management for current active subject
let currentSubjectData = null;

// Initial execution once DOM is completely loaded
document.addEventListener('DOMContentLoaded', () => {
    initSubjectPage();
});

/**
 * Parses url queries to locate current subjectId, then loads content
 * Includes fallback to sessionStorage in case URL parameters are stripped by routing
 */
async function initSubjectPage() {
    try {
        showLoading(true);
        hideError();

        console.log("[initSubjectPage] Current URL:", window.location.href);
        console.log("[initSubjectPage] Search string:", window.location.search);

        // Extract subject ID from the browser URL (e.g., ?id=1 or ?subjectId=1)
        const urlParams = new URLSearchParams(window.location.search);
        let subjectId = urlParams.get('id') || urlParams.get('subjectId');

        console.log("[initSubjectPage] Extracted subjectId from URL:", subjectId);

        // Fallback to sessionStorage in case URL parameters were lost during navigation
        if (!subjectId) {
            console.warn("[initSubjectPage] No ID in URL, checking sessionStorage...");
            subjectId = sessionStorage.getItem('selectedSubjectId');
            console.log("[initSubjectPage] SubjectId from sessionStorage:", subjectId);
        }

        // Final check - if still no ID, show error
        if (!subjectId) {
            console.error("No 'id' parameter found in URL or sessionStorage. Cannot load subject.");
            showError("No subject selected. Please go back and click on a subject to view its details.");
            showLoading(false);
            return;
        } else {
            console.log("[initSubjectPage] Valid subject ID found:", subjectId);
        }

        await fetchAndRenderSubjectDetails(subjectId);
    } catch (error) {
        console.error("Failed to initialize subject details page:", error);
        showError("The system failed to establish a secure connection or render the details.");
    } finally {
        showLoading(false);
    }
}

/**
 * Requests subject, quizzes, and modules details from backend API using CORRECT endpoint methods
 */
async function fetchAndRenderSubjectDetails(subjectId) {
    try {
        console.log("[fetchAndRenderSubjectDetails] Fetching data for subjectId:", subjectId);
        
        // Query server using ApiService methods with proper syntax
        // The ApiService.request() returns data directly, not wrapped in {data: ...}
        const subjectPromise = currentApiService.getSubjectById(subjectId);
        const modulesPromise = currentApiService.getModules(subjectId);
        const quizzesPromise = currentApiService.getQuizzes(subjectId, 'exam');

        console.log("[fetchAndRenderSubjectDetails] API calls initiated");

        // Await all parallel API calls
        const [subjectRes, modulesRes, quizzesRes] = await Promise.all([
            subjectPromise.catch(err => { console.warn("Subject API error:", err); return null; }),
            modulesPromise.catch(err => { console.warn("Modules API error:", err); return null; }),
            quizzesPromise.catch(err => { console.warn("Quizzes API error:", err); return null; })
        ]);

        console.log("[fetchAndRenderSubjectDetails] API responses received:", {
            subject: subjectRes ? 'OK' : 'FAILED',
            modules: modulesRes ? 'OK' : 'FAILED',
            quizzes: quizzesRes ? 'OK' : 'FAILED'
        });

        if (!subjectRes) {
            throw new Error("Could not find the requested subject in Database. Subject API returned no data.");
        }

        // Handle both wrapped {data: ...} and direct responses
        const subjectData = subjectRes.data || subjectRes;
        const modulesData = (modulesRes && (modulesRes.data || modulesRes)) ? (Array.isArray(modulesRes) ? modulesRes : modulesRes.data || modulesRes) : [];
        const quizzesData = (quizzesRes && (quizzesRes.data || quizzesRes)) ? (Array.isArray(quizzesRes) ? quizzesRes : quizzesRes.data || quizzesRes) : [];

        const data = {
            subject: subjectData,
            modules: Array.isArray(modulesData) ? modulesData : [],
            quizzes: Array.isArray(quizzesData) ? quizzesData : []
        };

        console.log("[fetchAndRenderSubjectDetails] Data prepared for rendering:", {
            subjectName: data.subject.name,
            moduleCount: data.modules.length,
            quizCount: data.quizzes.length
        });

        currentSubjectData = data;
        renderSubjectData(data);

    } catch (err) {
        console.error("API Fetch Error: ", err);
        showError(`Failed to fetch subject data from server. Details: ${err.message}`);
    }
}

/**
 * Renders the fetched data directly into the DOM
 */
function renderSubjectData(data) {
    if (!data || !data.subject) return;

    // Subject title & tag elements
    const titleEl = document.getElementById('subjectTitle');
    const categoryEl = document.querySelector('.category-badge');
    
    if (titleEl) {
        titleEl.innerText = data.subject.name || data.subject.title || 'Untitled Subject';
    }
    
    if (categoryEl) {
        categoryEl.innerText = data.subject.categoryName || 'General Education';
    }
    
    // Total Badge Counters
    const modulesCount = data.modules ? data.modules.length : 0;
    const quizzesCount = data.quizzes ? data.quizzes.length : 0;
    
    // Update all count display elements
    ['moduleCount', 'overviewModuleCount', 'modulesTabCount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = modulesCount;
    });
    
    ['quizCount', 'overviewQuizCount', 'quizzesTabCount'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = quizzesCount;
    });

    // Render Modules
    renderModulesList(data.modules || []);

    // Render Quizzes
    renderQuizzesTable(data.quizzes || []);
}

/**
 * Populates learning modules list view for BOTH dashboard layout panes
 */
function renderModulesList(modules) {
    // Select BOTH active layouts found inside your view-subject markup
    const primaryList = document.getElementById('moduleList');
    const tabList = document.getElementById('modulesTabList');
    
    if (!primaryList && !tabList) {
        console.warn("[renderModulesList] Neither moduleList nor modulesTabList containers found in DOM");
        return;
    }
    
    let htmlContent = '';

    if (modules.length === 0) {
        htmlContent = `
            <div style="text-align: center; padding: 2rem; background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px;">
                <i class="fa-regular fa-folder-open" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
                <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">No modules uploaded yet.</p>
            </div>
        `;
    } else {
        modules.forEach((mod, index) => {
            htmlContent += `
                <div class="module-card" style="background: white; padding: 1.25rem; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 0.75rem; transition: all 0.15s;">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="width: 48px; height: 48px; background: #eef2ff; color: #6366f1; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${index + 1}
                        </div>
                        <div>
                            <h4 style="margin: 0; font-weight: 600; color: #1e293b; font-size: 0.95rem;">${mod.title || mod.name || 'Untitled Module'}</h4>
                            <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: #94a3b8;">${mod.description || mod.content || 'No description added yet'}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button style="padding: 0.5rem; color: #94a3b8; background: none; border: none; cursor: pointer; border-radius: 6px; transition: all 0.15s;" title="View Module">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                        <button style="padding: 0.5rem; color: #94a3b8; background: none; border: none; cursor: pointer; border-radius: 6px; transition: all 0.15s;" title="Delete Module">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // Update BOTH containers
    if (primaryList) primaryList.innerHTML = htmlContent;
    if (tabList) tabList.innerHTML = htmlContent;
    
    console.log(`[renderModulesList] Rendered ${modules.length} modules to both containers`);
}

/**
 * Populates dynamic quiz tables for BOTH main layout view and standard quiz lists
 */
function renderQuizzesTable(quizzes) {
    const mainTable = document.getElementById('quizTableBody');
    const tabTable = document.getElementById('quizzesTabBody');
    
    if (!mainTable && !tabTable) {
        console.warn("[renderQuizzesTable] Neither quizTableBody nor quizzesTabBody containers found in DOM");
        return;
    }
    
    let htmlContent = '';

    if (quizzes.length === 0) {
        htmlContent = `
            <tr>
                <td colspan="6" style="padding: 3rem 1rem; text-align: center; color: #94a3b8;">
                    <i class="fa-regular fa-clipboard" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
                    No quizzes created yet. Click "Create Quiz" to add one.
                </td>
            </tr>
        `;
    } else {
        quizzes.forEach(quiz => {
            // Determine quiz status
            const status = quiz.is_draft ? 'Draft' : (quiz.is_synced ? 'Synced' : 'Unsynced');
            const statusColor = quiz.is_draft ? '#f59e0b' : (quiz.is_synced ? '#10b981' : '#ef4444');
            const statusBgColor = quiz.is_draft ? '#fef3c7' : (quiz.is_synced ? '#d1fae5' : '#fee2e2');
            
            htmlContent += `
                <tr style="transition: background-color 0.15s;" data-quiz-id="${quiz.id}">
                    <td style="padding: 1rem 0.75rem; font-weight: 600; color: #1e293b;">${quiz.title || quiz.name || 'Untitled Quiz'}</td>
                    <td style="padding: 1rem 0.75rem;">${quiz.questionsCount || quiz.question_count || 0} Questions</td>
                    <td style="padding: 1rem 0.75rem;">${quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No limit'}</td>
                    <td style="padding: 1rem 0.75rem;">${(quiz.questionsCount || quiz.question_count || 0) * 1} pts</td>
                    <td style="padding: 1rem 0.75rem; text-align: center;">
                        <span style="background-color: ${statusBgColor}; color: ${statusColor}; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${status}</span>
                    </td>
                    <td style="padding: 1rem 0.75rem; text-align: right;">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;">
                            <button title="Edit quiz" onclick="openQuizModal(${quiz.id})" style="color: #6366f1; background: none; border: none; cursor: pointer; transition: color 0.15s; font-size: 1rem;">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button title="Delete quiz" onclick="deleteQuiz(${quiz.id})" style="color: #ef4444; background: none; border: none; cursor: pointer; transition: color 0.15s; font-size: 1rem;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    // Update BOTH containers
    if (mainTable) mainTable.innerHTML = htmlContent;
    if (tabTable) tabTable.innerHTML = htmlContent;
    
    console.log(`[renderQuizzesTable] Rendered ${quizzes.length} quizzes to both containers`);
}

/**
 * Helper Tab toggles (Overview, Modules, Quizzes filter logic)
 */
function switchTab(activeTab) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach((tab, index) => {
        const tabName = ['overview', 'modules', 'quizzes'][index];
        if (tabName === activeTab) {
            tab.classList.add('active');
            contents[index]?.classList.add('active');
        } else {
            tab.classList.remove('active');
            contents[index]?.classList.remove('active');
        }
    });
}

/**
 * Helper screen loaders
 */
function showLoading(state) {
    const loader = document.querySelector('[style*="animate-pulse"]') || document.getElementById('loading-state');
    if (loader) {
        loader.style.display = state ? 'block' : 'none';
    }
}

function showError(msg) {
    const errorBox = document.querySelector('.error-message') || document.getElementById('error-state');
    if (errorBox) {
        const msgText = errorBox.querySelector('p') || errorBox;
        if (msgText.querySelector('p')) {
            msgText.querySelector('p').innerText = msg;
        } else {
            msgText.innerText = msg;
        }
        errorBox.style.display = 'block';
    }
}

function hideError() {
    const errorBox = document.querySelector('.error-message') || document.getElementById('error-state');
    if (errorBox) {
        errorBox.style.display = 'none';
    }
}

function retryLoading() {
    initSubjectPage();
}

/**
 * Mocked dummy data fallback to preserve application display in standalone view
 */
function getMockedSubjectData() {
    return {
        subject: {
            name: "General Psychology 101",
            title: "General Psychology 101",
            categoryName: "General Education"
        },
        modules: [
            { id: 1, name: "Introduction to Behavioral Science", title: "Introduction to Behavioral Science", description: "Read chapters 1-3. Focuses on classical conditioning models.", content: "Read chapters 1-3. Focuses on classical conditioning models." },
            { id: 2, name: "Cognitive Development theories", title: "Cognitive Development theories", description: "Piagetian stages and developmental psychology resources.", content: "Piagetian stages and developmental psychology resources." },
            { id: 3, name: "Neurological Processes & Sensation", title: "Neurological Processes & Sensation", description: "Examining sensory perception and synaptic pathways.", content: "Examining sensory perception and synaptic pathways." }
        ],
        quizzes: [
            { id: 101, name: "Midterm Brain Anatomy Quiz", title: "Midterm Brain Anatomy Quiz", question_count: 15, questionsCount: 15, timeLimit: 30, totalPoints: 30 },
            { id: 102, name: "Behavioral Models assessment", title: "Behavioral Models assessment", question_count: 10, questionsCount: 10, timeLimit: 20, totalPoints: 20 },
            { id: 103, name: "Memory and Recall Challenge", title: "Memory and Recall Challenge", question_count: 5, questionsCount: 5, timeLimit: 10, totalPoints: 10 },
            { id: 104, name: "Sensation Processes Quick quiz", title: "Sensation Processes Quick quiz", question_count: 20, questionsCount: 20, timeLimit: 40, totalPoints: 40 },
            { id: 105, name: "Cognitive Milestones Quiz", title: "Cognitive Milestones Quiz", question_count: 12, questionsCount: 12, timeLimit: 25, totalPoints: 24 },
            { id: 106, name: "End of Subject assessment", title: "End of Subject assessment", question_count: 50, questionsCount: 50, timeLimit: 90, totalPoints: 100 }
        ]
    };
}

// ====== Global Variables & DOM Elements ======
let words = []; // 단어 데이터를 담을 배열
let currentIndex = 0; // 현재 표시되는 단어의 인덱스
let isGeneralMode = true; // 현재 일반 모드인지 즐겨찾기 모드인지

// 스케줄 학습 관련 변수
let currentStudyDay = null; // 현재 학습 중인 일차 (null이면 전체 학습, Day X이면 해당 일차 학습)

// 폰트 크기 관련 전역 변수
const DEFAULT_FOREIGN_FONT_SIZE = 28; // px
const DEFAULT_MEANING_FONT_SIZE = 18; // px
const FONT_SIZE_STEP = 2; // px
const MIN_FOREIGN_FONT_SIZE = 20; // px
const MAX_FOREIGN_FONT_SIZE = 40; // px
const MIN_MEANING_FONT_SIZE = 14; // px
const MAX_MEANING_FONT_SIZE = 28; // px

let currentForeignFontSize = DEFAULT_FOREIGN_FONT_SIZE;
let currentMeaningFontSize = DEFAULT_MEANING_FONT_SIZE;

// TTS 관련 전역 변수
let availableVoices = []; // 사용 가능한 음성 목록
const TTS_LANG_MAP = { // 요청된 언어별 언어 코드 매핑 (fallback 포함)
    'ko': ['ko-KR'],
    'en': ['en-US', 'en-GB'], // 미국 영어 우선, 영국 영어 등 fallback
    'vi': ['vi-VN'],
    'km': ['km-KH'], // 캄보디아어(크메르어)
    'fa': ['fa-IR']  // 페르시아어(이란)
};

// 변경된 DOM 요소 참조
const flashcardContainer = document.getElementById('flashcardContainer');
const flashcardInner = flashcardContainer ? flashcardContainer.querySelector('.flashcard-inner') : null;
const foreignWordElem = document.getElementById('foreignWord');
const meaningElem = document.getElementById('meaning');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const statusMessageElem = document.getElementById('statusMessage');
// currentWordIndexElem와 totalWordsElem는 삭제됨
const favoriteIcon = document.getElementById('favoriteIcon');
const favoriteBtn = document.getElementById('favoriteBtn');
const generalModeBtn = document.getElementById('generalModeBtn');
const favoriteModeBtn = document.getElementById('favoriteModeBtn');
const speakBtn = document.getElementById('speakBtn');

// 새로운 DOM 요소들
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');

const sectionEditWord = document.querySelector('.section-edit-word');
const editForeignWordInput = document.getElementById('editForeignWord');
const editMeaningInput = document.getElementById('editMeaning');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editHr = document.querySelector('hr.edit-hr');

const increaseFontSizeBtn = document.getElementById('increaseFontSizeBtn');
const decreaseFontSizeBtn = document.getElementById('decreaseFontSizeBtn');

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 50;
const verticalScrollThreshold = 1.5;
const initialMoveThreshold = 5;
let isSwiping = false;
let isScrollIntent = false;

const clearFavoritesDayBtn = document.getElementById('clearFavoritesDayBtn');

const homeBtn = document.getElementById('homeBtn');

let isCurrentDayCompleted = false;
let isFullStudyCompletedOnce = false;

const toggleDisplayModeBtn = document.getElementById('toggleDisplayModeBtn');
const displayModeIcon = document.getElementById('displayModeIcon');
const unifiedControlsBar = document.querySelector('.unified-controls-bar');

let isCardFlipped = false;


// ====== Functions ======

function loadWords() {
    const storedWords = localStorage.getItem('foreignWords');
    if (storedWords) {
        try {
            const parsedWords = JSON.parse(storedWords);
            return parsedWords;
        } catch (e) {
            return getDefaultSampleWords();
        }
    } else {
        return getDefaultSampleWords();
    }
}

function getDefaultSampleWords() {
    return [
        { foreign: 'Apple', meaning: '사과', isFavorite: false, foreignLang: 'en-US', day: 1 },
        { foreign: '안녕하세요', meaning: 'Hello', isFavorite: false, foreignLang: 'ko-KR', day: 1 },
        { foreign: 'Book', meaning: '책', isFavorite: false, foreignLang: 'en-US', day: 1 },
        { foreign: '고맙습니다', meaning: 'Thank you', isFavorite: false, foreignLang: 'ko-KR', day: 2 },
        { foreign: 'Computer', meaning: '컴퓨터', isFavorite: false, foreignLang: 'en-US', day: 2 },
        { foreign: '죄송합니다', meaning: 'Sorry', isFavorite: false, foreignLang: 'ko-KR', day: 2 },
        { foreign: 'Water', meaning: '물', isFavorite: false, foreignLang: 'en-US', day: 3 },
        { foreign: '사랑합니다', meaning: 'I love you', isFavorite: false, foreignLang: 'ko-KR', day: 3 },
        { foreign: 'Friend', meaning: '친구', isFavorite: false, foreignLang: 'en-US', day: 3 },
        { foreign: '화장실이 어디예요?', meaning: 'Where is the restroom?', isFavorite: false, foreignLang: 'ko-KR', day: 4 },
        { foreign: 'Xin chào', meaning: '안녕하세요', isFavorite: false, foreignLang: 'vi-VN', day: 4 },
        { foreign: 'សួស្តី', meaning: '안녕하세요', isFavorite: false, foreignLang: 'km-KH', day: 5 },
        { foreign: 'سلام', meaning: '안녕하세요', isFavorite: false, foreignLang: 'fa-IR', day: 5 }
    ];
}

function saveWords() {
    localStorage.setItem('foreignWords', JSON.stringify(words));
}

function getWordsForCurrentMode() {
    let relevantWords = words;

    if (currentStudyDay !== null) {
        relevantWords = relevantWords.filter(word => word.day === currentStudyDay);
    }

    if (!isGeneralMode) {
        relevantWords = relevantWords.filter(word => word.isFavorite);
    }
    return relevantWords;
}

function displayWord() {
    const currentWords = getWordsForCurrentMode();
    const totalWordsForDisplay = currentWords.length; 
    
    if (totalWordsForDisplay === 0) {
        foreignWordElem.textContent = 'Không có từ nào.';
        meaningElem.textContent = (currentStudyDay !== null) ? `Không có từ nào được gán cho Ngày ${currentStudyDay}.` : (isGeneralMode ? 'Thêm từ mới hoặc nhập từ từ trang đầu tiên.' : 'Không có từ yêu thích nào.');
        statusMessageElem.textContent = '0 / 0'; // 단어가 없을 때 카운트 표시
        favoriteIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/star--v1.png';
        editBtn.disabled = true;
        deleteBtn.disabled = true;
        speakBtn.disabled = true;
        favoriteBtn.disabled = true;
        clearFavoritesDayBtn.disabled = true;
        if (flashcardContainer) flashcardContainer.style.pointerEvents = 'none';
        return;
    }

    editBtn.disabled = false;
    deleteBtn.disabled = false;
    speakBtn.disabled = false;
    favoriteBtn.disabled = false;
    clearFavoritesDayBtn.disabled = false; 
    if (flashcardContainer) flashcardContainer.style.pointerEvents = 'auto'; 
    
    if (currentIndex < 0) {
        currentIndex = 0;
    }
    if (currentIndex >= currentWords.length) {
        currentIndex = currentWords.length - 1;
    }

    const currentWord = currentWords[currentIndex];
    foreignWordElem.textContent = currentWord.foreign;
    meaningElem.textContent = currentWord.meaning;

    updateFavoriteIcon(currentWord.isFavorite);
    isCurrentDayCompleted = false;

    // --- 상태 메시지 및 카운트 통합 로직 (수정됨) ---
    // 기본적으로 단어 카운트를 표시하고, 특정 조건에서만 상태 메시지로 대체합니다.
    let statusText = `${currentIndex + 1} / ${totalWordsForDisplay}`;
    // Day 학습 모드에서는 순환하지 않으므로, 처음과 끝을 명확히 알려줍니다.
    if (currentStudyDay !== null) {
        prevBtn.disabled = (currentIndex === 0);
        nextBtn.disabled = (currentIndex === currentWords.length - 1);
        if (currentWords.length > 1) { // 단어가 2개 이상일 때만 메시지 표시
             if (currentIndex === 0) {
                statusText = 'Đây là từ đầu tiên.';
            } else if (currentIndex === currentWords.length - 1) {
                statusText = 'Đây là từ cuối cùng.';
            }
        }
    } else { // 전체 학습 모드에서는 버튼을 항상 활성화 (순환)
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }
    statusMessageElem.textContent = statusText;
    // --- 로직 끝 ---

    if (currentStudyDay !== null && currentIndex === currentWords.length - 1 && currentWords.length > 0) {
        const completedDays = JSON.parse(localStorage.getItem('completedDays') || '{}');
        if (!completedDays[`day${currentStudyDay}`]) { 
            completedDays[`day${currentStudyDay}`] = true;
            localStorage.setItem('completedDays', JSON.stringify(completedDays));
            alert(`Bạn đã hoàn thành việc học Ngày ${currentStudyDay}!`);
            isCurrentDayCompleted = true;
        }
    }

    saveCurrentIndex();

    isCardFlipped = false;
    if (flashcardContainer) {
        flashcardContainer.classList.remove('flipped');
        applyOverlayState(); 
    }
}

function saveCurrentIndex() {
    if (currentStudyDay === null) { 
        if (isGeneralMode) {
            localStorage.setItem('generalModeIndex', currentIndex);
        } else {
            localStorage.setItem('favoriteModeIndex', currentIndex);
        }
    }
}

function loadCurrentIndex() {
    const storedIndex = isGeneralMode ?
        localStorage.getItem('generalModeIndex') :
        localStorage.getItem('favoriteModeIndex');
    return storedIndex ? parseInt(storedIndex, 10) : 0;
}

function updateFavoriteIcon(isFavorite) {
    if (isFavorite) {
        favoriteIcon.src = 'https://img.icons8.com/ios-filled/24/FAB005/star--v1.png';
        favoriteIcon.alt = 'Bỏ yêu thích';
    } else {
        favoriteIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/star--v1.png';
        favoriteIcon.alt = 'Thêm vào mục yêu thích';
    }
}

function toggleFavorite() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) return;

    const currentWord = currentWordsInView[currentIndex];
    const originalWordIndex = words.findIndex(word =>
        word.foreign === currentWord.foreign && word.meaning === currentWord.meaning &&
        word.foreignLang === currentWord.foreignLang && word.day === currentWord.day 
    );

    if (originalWordIndex !== -1) {
        words[originalWordIndex].isFavorite = !words[originalWordIndex].isFavorite;
        saveWords();
        updateFavoriteIcon(words[originalWordIndex].isFavorite);

        if (!isGeneralMode) {
            if (!words[originalWordIndex].isFavorite) { 
                const updatedCurrentWordsInView = getWordsForCurrentMode();
                if (currentIndex >= updatedCurrentWordsInView.length && updatedCurrentWordsInView.length > 0) {
                    currentIndex--;
                }
                if (updatedCurrentWordsInView.length === 0) {
                    currentIndex = 0;
                }
                displayWord();
            }
        }
    }
}

function changeMode(generalMode) {
    isGeneralMode = generalMode;
    localStorage.setItem('lastAppMode', isGeneralMode ? 'general' : 'favorite');
    currentIndex = 0; 
    generalModeBtn.classList.toggle('active', isGeneralMode);
    favoriteModeBtn.classList.toggle('active', !isGeneralMode);
    displayWord();
    isCardFlipped = false;
    if (flashcardContainer) {
        flashcardContainer.classList.remove('flipped');
        applyOverlayState();
    }
}

function populateVoiceList() {
    availableVoices = window.speechSynthesis.getVoices();
}

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
    populateVoiceList();
}

function speakCurrentWord() {
    if (!('speechSynthesis' in window)) {
        alert('Trình duyệt này không hỗ trợ tổng hợp giọng nói (TTS).');
        return;
    }
    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) {
        alert('Không có từ nào để phát âm.');
        return;
    }
    const currentWord = currentWords[currentIndex];
    const textToSpeak = currentWord.foreign;
    const langToSpeak = currentWord.foreignLang || 'en-US'; 
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langToSpeak;
    const langPrefix = langToSpeak.substring(0, 2); 
    const desiredLangs = TTS_LANG_MAP[langPrefix]; 
    let selectedVoice = null;
    if (desiredLangs) {
        for (const langCode of desiredLangs) {
            selectedVoice = availableVoices.find(v => v.lang === langCode);
            if (selectedVoice) break;
        }
    }
    if (!selectedVoice) {
        selectedVoice = availableVoices.find(v => v.lang.startsWith(langPrefix));
    }
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onerror = (event) => {
        alert('Đã xảy ra lỗi khi phát âm. Vui lòng kiểm tra cài đặt giọng nói của trình duyệt hoặc kết nối internet. Lỗi: ' + event.error);
    };
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
}

function deleteWord() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) {
        alert('Không có từ nào để xóa.');
        return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa từ này không?\n\n' + currentWordsInView[currentIndex].foreign + ' - ' + currentWordsInView[currentIndex].meaning)) {
        return;
    }
    const currentWordToDelete = currentWordsInView[currentIndex];
    const originalWordIndex = words.findIndex(word =>
        word.foreign === currentWordToDelete.foreign && word.meaning === currentWordToDelete.meaning &&
        word.foreignLang === currentWordToDelete.foreignLang && word.day === currentWordToDelete.day
    );
    if (originalWordIndex !== -1) {
        words.splice(originalWordIndex, 1);
        saveWords();
        if (currentIndex >= getWordsForCurrentMode().length && currentIndex > 0) {
            currentIndex--;
        }
        if (getWordsForCurrentMode().length === 0) {
            currentIndex = 0;
        }
        displayWord();
        isCardFlipped = false;
        if (flashcardContainer) flashcardContainer.classList.remove('flipped');
        applyOverlayState(); 
        alert('Từ đã được xóa.');
    }
}

function startEdit() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) {
        alert('Không có từ nào để sửa.');
        return;
    }
    const currentWord = currentWordsInView[currentIndex];
    editForeignWordInput.value = currentWord.foreign;
    editMeaningInput.value = currentWord.meaning;
    sectionEditWord.style.display = 'block';
    editHr.style.display = 'block';
    if (unifiedControlsBar) unifiedControlsBar.style.display = 'none';
    if (flashcardContainer) flashcardContainer.style.pointerEvents = 'none';
}

function saveEdit() {
    const currentWordsInView = getWordsForCurrentMode();
    if (currentWordsInView.length === 0) return;
    const editedForeign = editForeignWordInput.value.trim();
    const editedMeaning = editMeaningInput.value.trim();
    if (editedForeign && editedMeaning) {
        const currentWord = currentWordsInView[currentIndex];
        const originalWordIndex = words.findIndex(word =>
            word.foreign === currentWord.foreign && word.meaning === currentWord.meaning &&
            word.foreignLang === currentWord.foreignLang && word.day === currentWord.day
        );
        if (originalWordIndex !== -1) {
            words[originalWordIndex].foreign = editedForeign;
            words[originalWordIndex].meaning = editedMeaning;
            saveWords();
            cancelEdit(); 
            displayWord();
            isCardFlipped = false;
            if (flashcardContainer) flashcardContainer.classList.remove('flipped');
            applyOverlayState(); 
            alert('Từ đã được sửa!');
        }
    } else {
        alert('Vui lòng nhập cả từ tiếng nước ngoài và nghĩa.');
    }
}

function cancelEdit() {
    sectionEditWord.style.display = 'none';
    editHr.style.display = 'none';
    if (unifiedControlsBar) unifiedControlsBar.style.display = 'flex';
    if (flashcardContainer) flashcardContainer.style.pointerEvents = 'auto';
}

function applyOverlayState() {
    const selectedMode = localStorage.getItem('displayMode') || 'AB'; 
    if (!flashcardContainer || getWordsForCurrentMode().length === 0) { 
        return;
    }
    if (selectedMode === 'AB') {
        flashcardContainer.classList.remove('flipped');
        isCardFlipped = false;
        if (displayModeIcon) displayModeIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/forward--v1.png';
        displayModeIcon.alt = 'Nước ngoài ➡️ Tiếng mẹ đẻ (B)';
    } else if (selectedMode === 'BA') {
        flashcardContainer.classList.add('flipped');
        isCardFlipped = true; 
        if (displayModeIcon) displayModeIcon.src = 'https://img.icons8.com/ios-glyphs/24/000000/back--v1.png';
        displayModeIcon.alt = 'Tiếng mẹ đẻ ➡️ Nước ngoài (A)';
    }
}

function toggleDisplayMode() {
    const currentMode = localStorage.getItem('displayMode') || 'AB';
    const newMode = (currentMode === 'AB') ? 'BA' : 'AB';
    localStorage.setItem('displayMode', newMode);
    applyOverlayState();
}

function flipFlashcard() {
    if (getWordsForCurrentMode().length === 0) return;
    if (flashcardContainer) {
        isCardFlipped = !isCardFlipped;
        flashcardContainer.classList.toggle('flipped', isCardFlipped);
    }
}

function loadFontSizes() {
    const storedForeignSize = localStorage.getItem('foreignFontSize');
    const storedMeaningSize = localStorage.getItem('meaningFontSize');
    currentForeignFontSize = storedForeignSize ? parseInt(storedForeignSize, 10) : DEFAULT_FOREIGN_FONT_SIZE;
    currentMeaningFontSize = storedMeaningSize ? parseInt(storedMeaningSize, 10) : DEFAULT_MEANING_FONT_SIZE;
    currentForeignFontSize = Math.max(MIN_FOREIGN_FONT_SIZE, Math.min(currentForeignFontSize, MAX_FOREIGN_FONT_SIZE));
    currentMeaningFontSize = Math.max(MIN_MEANING_FONT_SIZE, Math.min(currentMeaningFontSize, MAX_MEANING_FONT_SIZE));
}

function saveFontSizes() {
    localStorage.setItem('foreignFontSize', currentForeignFontSize);
    localStorage.setItem('meaningFontSize', currentMeaningFontSize);
}

function applyFontSizes() {
    foreignWordElem.style.fontSize = `${currentForeignFontSize}px`;
    meaningElem.style.fontSize = `${currentMeaningFontSize}px`;
}

function adjustFontSize(isIncrease) {
    if (isIncrease) {
        currentForeignFontSize = Math.min(currentForeignFontSize + FONT_SIZE_STEP, MAX_FOREIGN_FONT_SIZE);
        currentMeaningFontSize = Math.min(currentMeaningFontSize + FONT_SIZE_STEP, MAX_MEANING_FONT_SIZE);
    } else {
        currentForeignFontSize = Math.max(currentForeignFontSize - FONT_SIZE_STEP, MIN_FOREIGN_FONT_SIZE);
        currentMeaningFontSize = Math.max(currentMeaningFontSize - FONT_SIZE_STEP, MIN_MEANING_FONT_SIZE);
    }
    saveFontSizes();
    applyFontSizes();
}

function clearDayFavorites() {
    let targetWordsForConfirm;
    let confirmMessage;
    if (currentStudyDay !== null) {
        targetWordsForConfirm = words.filter(word => word.day === currentStudyDay && word.isFavorite);
        if (targetWordsForConfirm.length === 0) {
            alert(`Không có từ yêu thích nào trong Ngày ${currentStudyDay}.`);
            return;
        }
        confirmMessage = `Bạn có chắc chắn muốn bỏ yêu thích tất cả ${targetWordsForConfirm.length} từ trong Ngày ${currentStudyDay} không?`;
    } else {
        targetWordsForConfirm = words.filter(word => word.isFavorite);
        if (targetWordsForConfirm.length === 0) {
            alert('Không có từ yêu thích nào.');
            return;
        }
        confirmMessage = `Bạn có chắc chắn muốn bỏ yêu thích tất cả ${targetWordsForConfirm.length} từ không?`;
    }
    if (!confirm(confirmMessage)) {
        return;
    }
    let clearedCount = 0;
    words.forEach(word => {
        if (currentStudyDay !== null) {
            if (word.day === currentStudyDay && word.isFavorite) {
                word.isFavorite = false;
                clearedCount++;
            }
        } else {
            if (word.isFavorite) {
                word.isFavorite = false;
                clearedCount++;
            }
        }
    });
    saveWords();
    alert(`Đã bỏ yêu thích ${clearedCount} từ.`);
    currentIndex = 0; 
    displayWord();
}

function goHome() {
    if (currentStudyDay !== null) {
        if (!isCurrentDayCompleted) {
            localStorage.setItem('lastInterruptedStudyDay', currentStudyDay);
            localStorage.setItem('lastInterruptedStudyIndex', currentIndex);
        } else {
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
        }
        localStorage.removeItem('lastInterruptedFullStudyIndex');
        localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        localStorage.removeItem('isFullStudyCompletedFlag'); 
    } else { 
        if (isGeneralMode) {
            if (!isFullStudyCompletedOnce) { 
                localStorage.setItem('lastInterruptedFullStudyIndex', currentIndex);
            } else {
                localStorage.removeItem('lastInterruptedFullStudyIndex');
            }
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        } else {
            localStorage.setItem('lastInterruptedFavoriteStudyIndex', currentIndex);
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFullStudyIndex');
            localStorage.removeItem('isFullStudyCompletedFlag'); 
        }
    }
    localStorage.removeItem('currentStudyDay'); 
    localStorage.removeItem('navigateToWord'); 
    localStorage.removeItem('navigateToDay');
    localStorage.removeItem('navigateToIndex'); 
    localStorage.removeItem('navigateToFullStudyIndex'); 
    localStorage.removeItem('navigateToFavoriteStudyIndex'); 
    window.location.href = 'index.html'; 
}

if (flashcardContainer) {
    flashcardContainer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) { 
            touchStartX = e.touches[0].clientX; 
            touchStartY = e.touches[0].clientY; 
            isSwiping = false; 
            isScrollIntent = false; 
        }
    });

    flashcardContainer.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) { 
            const currentTouchX = e.touches[0].clientX; 
            const currentTouchY = e.touches[0].clientY; 
            const deltaX = currentTouchX - touchStartX;
            const deltaY = currentTouchY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            if (!isSwiping && !isScrollIntent) {
                if (absDeltaX > initialMoveThreshold || absDeltaY > initialMoveThreshold) {
                    if (absDeltaX > absDeltaY * verticalScrollThreshold) {
                        isSwiping = true;
                        e.preventDefault(); 
                    } else if (absDeltaY > absDeltaX * verticalScrollThreshold) {
                        isScrollIntent = true; 
                    }
                }
            } else if (isSwiping) {
                e.preventDefault();
            }
            touchEndX = currentTouchX;
            touchEndY = currentTouchY;
        }
    });

    flashcardContainer.addEventListener('touchend', (e) => {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        if (absDeltaX > swipeThreshold && absDeltaX > absDeltaY * verticalScrollThreshold) {
            if (deltaX > 0) {
                prevBtn.click();
            } else {
                nextBtn.click();
            }
        }
        isSwiping = false;
        isScrollIntent = false;
        touchStartX = 0;
        touchStartY = 0;
        touchEndX = 0;
        touchEndY = 0;
    });

    flashcardContainer.addEventListener('click', () => {
        if (!isSwiping) {
            flipFlashcard();
        }
    });
}

prevBtn.addEventListener('click', () => {
    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) return;
    if (currentStudyDay !== null) {
        if (currentIndex > 0) {
            currentIndex--;
            displayWord();
        }
    } else {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : currentWords.length - 1;
        displayWord();
    }
});

nextBtn.addEventListener('click', () => {
    const currentWords = getWordsForCurrentMode();
    if (currentWords.length === 0) return;
    if (currentStudyDay !== null) {
        if (currentIndex < currentWords.length - 1) {
            currentIndex++;
            displayWord();
        }
    } else {
        if (currentIndex < currentWords.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
            if (currentWords.length > 0) {
                if (isGeneralMode) {
                    alert('Chúc mừng! Bạn đã hoàn thành toàn bộ quá trình học từ vựng!');
                    localStorage.setItem('isFullStudyCompletedFlag', 'true'); 
                    goHome();
                    return;
                } else {
                    alert('Chúc mừng! Bạn đã ôn tập hết danh sách từ yêu thích!');
                    goHome();
                    return;
                }
            }
        }
        displayWord();
    }
});

favoriteBtn.addEventListener('click', toggleFavorite);
generalModeBtn.addEventListener('click', () => changeMode(true));
favoriteModeBtn.addEventListener('click', () => changeMode(false));
speakBtn.addEventListener('click', speakCurrentWord);
editBtn.addEventListener('click', startEdit);
deleteBtn.addEventListener('click', deleteWord);
saveEditBtn.addEventListener('click', saveEdit);
cancelEditBtn.addEventListener('click', cancelEdit);
if (clearFavoritesDayBtn) clearFavoritesDayBtn.addEventListener('click', clearDayFavorites);
homeBtn.addEventListener('click', goHome);
increaseFontSizeBtn.addEventListener('click', () => adjustFontSize(true));
decreaseFontSizeBtn.addEventListener('click', () => adjustFontSize(false));
if (toggleDisplayModeBtn) toggleDisplayModeBtn.addEventListener('click', toggleDisplayMode);

window.addEventListener('load', () => {
    words = loadWords();
    currentStudyDay = localStorage.getItem('currentStudyDay') ? parseInt(localStorage.getItem('currentStudyDay'), 10) : null;
    loadFontSizes();
    applyFontSizes();
    applyOverlayState();
    let initialIndex = 0;
    let initialModeIsGeneral = true;
    const navigateToWord = localStorage.getItem('navigateToWord');
    const navigateToDay = localStorage.getItem('navigateToDay');
    const navigateToIndex = localStorage.getItem('navigateToIndex');
    const navigateToFullStudyIndex = localStorage.getItem('navigateToFullStudyIndex');
    const navigateToFavoriteStudyIndex = localStorage.getItem('navigateToFavoriteStudyIndex');
    if (navigateToWord) {
        const targetWord = JSON.parse(navigateToWord);
        localStorage.removeItem('navigateToWord');
        currentStudyDay = targetWord.day !== undefined ? targetWord.day : null;
        initialModeIsGeneral = true;
        const currentWordsInView = getWordsForCurrentMode();
        const foundIndex = currentWordsInView.findIndex(word =>
            word.foreign === targetWord.foreign && word.meaning === targetWord.meaning &&
            word.foreignLang === targetWord.foreignLang && word.day === targetWord.day
        );
        initialIndex = (foundIndex !== -1) ? foundIndex : 0;
    } else if (navigateToDay && navigateToIndex) {
        currentStudyDay = parseInt(navigateToDay, 10);
        initialIndex = parseInt(navigateToIndex, 10);
        initialModeIsGeneral = true;
        localStorage.removeItem('navigateToDay');
        localStorage.removeItem('navigateToIndex');
    } else if (navigateToFullStudyIndex !== null) {
        initialIndex = parseInt(navigateToFullStudyIndex, 10);
        initialModeIsGeneral = true;
        currentStudyDay = null;
        localStorage.removeItem('navigateToFullStudyIndex');
    } else if (navigateToFavoriteStudyIndex !== null) {
        initialIndex = parseInt(navigateToFavoriteStudyIndex, 10);
        initialModeIsGeneral = false;
        currentStudyDay = null;
        localStorage.removeItem('navigateToFavoriteStudyIndex');
    } else {
        const lastAppMode = localStorage.getItem('lastAppMode');
        if (currentStudyDay !== null) {
            initialModeIsGeneral = true;
            initialIndex = 0;
        } else {
            initialModeIsGeneral = (lastAppMode === 'favorite') ? false : true;
            initialIndex = loadCurrentIndex();
        }
    }
    isGeneralMode = initialModeIsGeneral;
    currentIndex = initialIndex;
    isFullStudyCompletedOnce = localStorage.getItem('isFullStudyCompletedFlag') === 'true';
    generalModeBtn.classList.toggle('active', isGeneralMode);
    favoriteModeBtn.classList.toggle('active', !isGeneralMode);
    displayWord();
});

window.addEventListener('beforeunload', () => {
    if (currentStudyDay !== null) {
        if (!isCurrentDayCompleted) {
            localStorage.setItem('lastInterruptedStudyDay', currentStudyDay);
            localStorage.setItem('lastInterruptedStudyIndex', currentIndex);
        } else {
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
        }
        localStorage.removeItem('lastInterruptedFullStudyIndex');
        localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        localStorage.removeItem('isFullStudyCompletedFlag');
    } else {
        if (isGeneralMode) {
            if (!isFullStudyCompletedOnce) {
                localStorage.setItem('lastInterruptedFullStudyIndex', currentIndex);
            } else {
                localStorage.removeItem('lastInterruptedFullStudyIndex');
            }
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFavoriteStudyIndex');
        } else {
            localStorage.setItem('lastInterruptedFavoriteStudyIndex', currentIndex);
            localStorage.removeItem('lastInterruptedStudyDay');
            localStorage.removeItem('lastInterruptedStudyIndex');
            localStorage.removeItem('lastInterruptedFullStudyIndex');
            localStorage.removeItem('isFullStudyCompletedFlag');
        }
    }
    localStorage.removeItem('currentStudyDay');
    localStorage.removeItem('navigateToWord');
    localStorage.removeItem('navigateToDay');
    localStorage.removeItem('navigateToIndex');
    localStorage.removeItem('navigateToFullStudyIndex');
    localStorage.removeItem('navigateToFavoriteStudyIndex');
});
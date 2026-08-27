// ===== 应用状态 =====
const app = {
    data: [],
    currentDetailId: null,
    tempImageBase64: null,
    voiceTags: [],
    releaseTags: [],
    currentRating: 0,

    // ===== 初始化 =====
    init() {
        this.loadFromStorage();
        this.render();
        
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        this.initStarRating();
    },

    // ===== LocalStorage =====
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('otomeCollection');
            if (saved) {
                this.data = JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载数据失败:', e);
            this.data = [];
        }
    },

    saveToStorage() {
        try {
            localStorage.setItem('otomeCollection', JSON.stringify(this.data));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },

    // ===== 星级评分 - 支持半星 =====
    initStarRating() {
        const container = document.getElementById('starRatingInput');
        container.innerHTML = '';
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.dataset.value = i;
            
            star.addEventListener('click', (e) => {
                const rect = star.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isLeftHalf = x < rect.width / 2;
                const value = isLeftHalf ? i - 0.5 : i;
                this.setRating(value);
            });
            
            star.addEventListener('mousemove', (e) => {
                const rect = star.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isLeftHalf = x < rect.width / 2;
                const value = isLeftHalf ? i - 0.5 : i;
                this.previewRating(value);
            });
            
            container.appendChild(star);
        }
        
        container.addEventListener('mouseleave', () => {
            this.renderStars(this.currentRating);
        });
    },

    setRating(value) {
        this.currentRating = value;
        document.getElementById('rating').value = value;
        this.renderStars(value);
    },

    previewRating(value) {
        this.renderStars(value, true);
    },

    renderStars(value, isPreview = false) {
        const stars = document.querySelectorAll('#starRatingInput .star');
        
        stars.forEach((star, index) => {
            const starValue = index + 1;
            star.className = 'star';
            
            if (value >= starValue) {
                star.classList.add('full');
            } else if (value >= starValue - 0.5) {
                star.classList.add('half');
            }
        });
    },

    // ===== 声优标签 =====
    handleVoiceInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addVoiceTagFromInput();
        }
    },

    addVoiceTagFromInput() {
        const input = document.getElementById('voiceInput');
        const value = input.value.trim();
        if (!value) return;
        
        const match = value.match(/^(.+?)（(.+?)）$/);
        if (!match) {
            alert('格式错误！请使用：角色名（声优名）');
            return;
        }
        
        const [_, charName, seiyuuName] = match;
        
        if (this.voiceTags.some(t => t.char === charName && t.seiyuu === seiyuuName)) {
            alert('该声优已添加！');
            return;
        }
        
        this.voiceTags.push({ char: charName, seiyuu: seiyuuName });
        this.renderVoiceTags();
        input.value = '';
    },

    removeVoiceTag(index) {
        this.voiceTags.splice(index, 1);
        this.renderVoiceTags();
    },

    renderVoiceTags() {
        const container = document.getElementById('voiceTags');
        container.innerHTML = '';
        
        this.voiceTags.forEach((tag, index) => {
            const el = document.createElement('span');
            el.className = 'tag tag-voice';
            el.innerHTML = `
                <span>${tag.char}</span>
                <span class="tag-seiyuu">（${tag.seiyuu}）</span>
                <span class="tag-remove" onclick="app.removeVoiceTag(${index})">×</span>
            `;
            container.appendChild(el);
        });
        
        document.getElementById('voiceActors').value = JSON.stringify(this.voiceTags);
    },

    // ===== 发售标签 =====
    handleReleaseInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addReleaseTagFromInput();
        }
    },

    addReleaseTagFromInput() {
        const input = document.getElementById('releaseInput');
        const value = input.value.trim();
        if (!value) return;
        
        if (!value.includes('：') && !value.includes(':')) {
            alert('格式错误！请使用：2011年7月28日：PSP版');
            return;
        }
        
        if (this.releaseTags.includes(value)) {
            alert('该发售记录已添加！');
            return;
        }
        
        this.releaseTags.push(value);
        this.renderReleaseTags();
        input.value = '';
    },

    removeReleaseTag(index) {
        this.releaseTags.splice(index, 1);
        this.renderReleaseTags();
    },

    renderReleaseTags() {
        const container = document.getElementById('releaseTags');
        container.innerHTML = '';
        
        this.releaseTags.forEach((tag, index) => {
            const el = document.createElement('span');
            el.className = 'tag';
            el.innerHTML = `
                <span>${tag}</span>
                <span class="tag-remove" onclick="app.removeReleaseTag(${index})">×</span>
            `;
            container.appendChild(el);
        });
        
        document.getElementById('releaseDate').value = JSON.stringify(this.releaseTags);
    },

    // ===== 数据操作 =====
    addGame(game) {
        this.data.push({
            ...game,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        });
        this.saveToStorage();
        this.render();
    },

    updateGame(id, updatedGame) {
        const index = this.data.findIndex(g => g.id === id);
        if (index !== -1) {
            this.data[index] = { ...updatedGame, id };
            this.saveToStorage();
            this.render();
        }
    },

    deleteGame(id) {
        if (confirm('确定要删除这个游戏记录吗？🎀')) {
            this.data = this.data.filter(g => g.id !== id);
            this.saveToStorage();
            this.closeModal('detail');
            this.render();
        }
    },

    // ===== 渲染 =====
    render(filterText = '') {
        const grid = document.getElementById('gameGrid');
        const empty = document.getElementById('emptyState');
        
        grid.innerHTML = '';

        const filteredData = this.data.filter(game => {
            if (!filterText) return true;
            const text = filterText.toLowerCase();
            
            let searchable = [
                game.title,
                game.writer,
                game.artist,
                game.developer
            ].join(' ').toLowerCase();
            
            if (game.voiceActors) {
                try {
                    const voiceList = JSON.parse(game.voiceActors);
                    const seiyuuNames = voiceList.map(v => v.seiyuu).join(' ');
                    searchable += ' ' + seiyuuNames.toLowerCase();
                } catch (e) {}
            }
            
            return searchable.includes(text);
        });

        if (filteredData.length === 0) {
            empty.classList.remove('hidden');
            grid.classList.add('hidden');
        } else {
            empty.classList.add('hidden');
            grid.classList.remove('hidden');
            
            filteredData.forEach(game => {
                const card = document.createElement('div');
                card.className = 'game-card';
                card.onclick = () => this.showDetail(game.id);

                const imgHtml = game.image 
                    ? `<img src="${game.image}" class="card-image" alt="${game.title}">` 
                    : `<div class="card-image-placeholder">🎮</div>`;

                const rating = parseFloat(game.rating) || 0;
                const starsHtml = this.renderCardStars(rating);

                card.innerHTML = `
                    ${imgHtml}
                    <div class="card-info">
                        <div class="card-title">${this.escapeHtml(game.title) || '未命名游戏'}</div>
                        <div class="card-meta">${this.escapeHtml(game.writer) || '未知剧本'}</div>
                        ${rating > 0 ? starsHtml : ''}
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }
    },

    // 卡片星级 - 使用CSS裁剪，兼容所有设备
    renderCardStars(rating) {
        let starsHtml = '<div class="card-rating">';
        
        for (let i = 1; i <= 5; i++) {
            let starClass = '';
            if (rating >= i) {
                starClass = 'full';
            } else if (rating >= i - 0.5) {
                starClass = 'half';
            }
            
            starsHtml += `
                <span class="star-wrapper ${starClass}">
                    <span class="star-bg">★</span>
                    <span class="star-fill">★</span>
                </span>
            `;
        }
        
        starsHtml += `<span class="rating-num">${rating.toFixed(1)}</span></div>`;
        return starsHtml;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ===== 弹窗控制 =====
    openModal(type) {
        if (type === 'add') {
            this.resetForm();
            document.getElementById('formModal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(type) {
        document.getElementById(`${type}Modal`).classList.add('hidden');
        document.body.style.overflow = '';
    },

    resetForm() {
        document.getElementById('gameForm').reset();
        document.getElementById('gameId').value = '';
        this.tempImageBase64 = null;
        this.currentRating = 0;
        
        const preview = document.getElementById('previewImage');
        preview.src = '';
        preview.classList.add('hidden');
        document.getElementById('uploadPlaceholder').classList.remove('hidden');
        
        this.voiceTags = [];
        this.releaseTags = [];
        this.renderVoiceTags();
        this.renderReleaseTags();
        
        this.renderStars(0);
    },

    // ===== 图片处理 =====
    handleImageUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tempImageBase64 = e.target.result;
                const preview = document.getElementById('previewImage');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
                document.getElementById('uploadPlaceholder').classList.add('hidden');
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    // ===== 保存游戏 =====
    saveGame(e) {
        e.preventDefault();
        
        const id = document.getElementById('gameId').value;
        
        const gameData = {
            title: document.getElementById('title').value.trim(),
            artist: document.getElementById('artist').value.trim(),
            writer: document.getElementById('writer').value.trim(),
            voiceActors: document.getElementById('voiceActors').value,
            developer: document.getElementById('developer').value.trim(),
            releaseDate: document.getElementById('releaseDate').value,
            playTime: document.getElementById('playTime').value.trim(),
            rating: this.currentRating,
            review: document.getElementById('review').value.trim(),
            image: this.tempImageBase64
        };

        if (!gameData.title) {
            alert('请输入游戏名！');
            return;
        }

        if (id) {
            this.updateGame(id, gameData);
        } else {
            this.addGame(gameData);
        }
        
        this.closeModal('form');
    },

    // ===== 详情展示 =====
    showDetail(id) {
        const game = this.data.find(g => g.id === id);
        if (!game) return;

        this.currentDetailId = id;
        
        document.getElementById('detailTitle').textContent = game.title || '未命名';
        document.getElementById('detailTitleOverlay').textContent = game.title || '未命名';
        
        const imgEl = document.getElementById('detailImage');
        if (game.image) {
            imgEl.src = game.image;
            imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
        }
        
        document.getElementById('detailArtist').textContent = game.artist || '-';
        document.getElementById('detailWriter').textContent = game.writer || '-';
        document.getElementById('detailDev').textContent = game.developer || '-';
        document.getElementById('detailTime').textContent = game.playTime || '-';
        document.getElementById('detailReview').textContent = game.review || '暂无感想';

        // 渲染声优
        const voiceContainer = document.getElementById('detailVoice');
        voiceContainer.innerHTML = '';
        if (game.voiceActors) {
            try {
                const voiceList = JSON.parse(game.voiceActors);
                voiceList.forEach(v => {
                    const line = document.createElement('div');
                    line.className = 'voice-line';
                    line.innerHTML = `
                        <span class="voice-char">${this.escapeHtml(v.char)}</span>
                        <span class="voice-sep">（声：</span>
                        <span class="voice-seiyuu">${this.escapeHtml(v.seiyuu)}</span>
                        <span class="voice-sep">）</span>
                    `;
                    voiceContainer.appendChild(line);
                });
            } catch (e) {
                voiceContainer.textContent = game.voiceActors;
            }
        } else {
            voiceContainer.textContent = '-';
        }

        // 渲染发售日期
        const dateContainer = document.getElementById('detailDate');
        dateContainer.innerHTML = '';
        if (game.releaseDate) {
            try {
                const dateList = JSON.parse(game.releaseDate);
                dateList.forEach(d => {
                    const line = document.createElement('div');
                    line.className = 'release-line';
                    line.textContent = d;
                    dateContainer.appendChild(line);
                });
            } catch (e) {
                dateContainer.textContent = game.releaseDate;
            }
        } else {
            dateContainer.textContent = '-';
        }

        // 渲染星级 - 使用CSS裁剪实现半星
        const ratingContainer = document.getElementById('detailRating');
        ratingContainer.innerHTML = '';
        const rating = parseFloat(game.rating) || 0;
        
        const ratingNum = document.createElement('span');
        ratingNum.className = 'rating-number';
        ratingNum.textContent = rating > 0 ? rating.toFixed(1) : '未评分';
        ratingContainer.appendChild(ratingNum);
        
        if (rating > 0) {
            for (let i = 1; i <= 5; i++) {
                const wrapper = document.createElement('span');
                wrapper.className = 'star-icon';
                
                if (rating >= i) {
                    wrapper.classList.add('full');
                } else if (rating >= i - 0.5) {
                    wrapper.classList.add('half');
                }
                
                wrapper.innerHTML = `
                    <span class="star-bg">★</span>
                    <span class="star-fill">★</span>
                `;
                
                ratingContainer.appendChild(wrapper);
            }
        }

        document.getElementById('detailModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    // ===== 编辑当前游戏 =====
    editCurrentGame() {
        const game = this.data.find(g => g.id === this.currentDetailId);
        if (!game) return;

        this.closeModal('detail');
        this.resetForm();

        document.getElementById('gameId').value = game.id;
        document.getElementById('title').value = game.title || '';
        document.getElementById('artist').value = game.artist || '';
        document.getElementById('writer').value = game.writer || '';
        document.getElementById('developer').value = game.developer || '';
        document.getElementById('playTime').value = game.playTime || '';
        document.getElementById('review').value = game.review || '';
        
        const savedRating = parseFloat(game.rating) || 0;
        this.setRating(savedRating);

        if (game.image) {
            this.tempImageBase64 = game.image;
            const preview = document.getElementById('previewImage');
            preview.src = game.image;
            preview.classList.remove('hidden');
            document.getElementById('uploadPlaceholder').classList.add('hidden');
        }

        if (game.voiceActors) {
            try {
                this.voiceTags = JSON.parse(game.voiceActors);
                this.renderVoiceTags();
            } catch (e) {}
        }

        if (game.releaseDate) {
            try {
                this.releaseTags = JSON.parse(game.releaseDate);
                this.renderReleaseTags();
            } catch (e) {}
        }

        document.getElementById('formModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    deleteCurrentGame() {
        this.deleteGame(this.currentDetailId);
    },

    // ===== 导入导出 =====
    exportData() {
        if (this.data.length === 0) {
            alert('没有数据可导出！请先添加游戏~');
            return;
        }
        
        const exportObj = {
            version: '1.1',
            exportDate: new Date().toISOString(),
            games: this.data
        };
        
        const dataStr = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `otome-collection-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                
                let games = [];
                if (Array.isArray(json)) {
                    games = json;
                } else if (json.games && Array.isArray(json.games)) {
                    games = json.games;
                } else {
                    throw new Error('格式错误');
                }

                const validGames = games.filter(g => g.title);
                
                if (validGames.length === 0) {
                    alert('没有找到有效的游戏数据！');
                    return;
                }

                if (confirm(`确定导入 ${validGames.length} 条游戏记录吗？这将覆盖当前所有数据！`)) {
                    this.data = validGames;
                    this.saveToStorage();
                    this.render();
                    alert(`成功导入 ${validGames.length} 条记录！🎀`);
                }
            } catch (err) {
                console.error(err);
                alert('导入失败：文件格式不正确或已损坏');
            }
            input.value = '';
        };
        reader.readAsText(file);
    }
};

// ===== 启动应用 =====
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});


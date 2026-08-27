// ===== 应用状态 =====
const app = {
    data: [],
    currentDetailId: null,
    tempImageBase64: null,

    // ===== 初始化 =====
    init() {
        this.render();
        
        // 搜索监听
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        // 星级评分交互
        this.initStarRating();
    },

    // ===== 星级评分初始化 =====
    initStarRating() {
        const stars = document.querySelectorAll('#starRatingInput .star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.setRating(index + 1);
            });
            
            star.addEventListener('mouseenter', () => {
                this.highlightStars(index + 1);
            });
        });
        
        document.getElementById('starRatingInput').addEventListener('mouseleave', () => {
            const currentRating = parseInt(document.getElementById('rating').value) || 0;
            this.highlightStars(currentRating);
        });
    },

    setRating(val) {
        document.getElementById('rating').value = val;
        this.highlightStars(val);
    },

    highlightStars(count) {
        const stars = document.querySelectorAll('#starRatingInput .star');
        stars.forEach((star, index) => {
            if (index < count) {
                star.textContent = '★';
                star.classList.add('active');
            } else {
                star.textContent = '☆';
                star.classList.remove('active');
            }
        });
    },

    // ===== 数据操作 =====
    addGame(game) {
        this.data.push({
            ...game,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        });
        this.render();
    },

    updateGame(id, updatedGame) {
        const index = this.data.findIndex(g => g.id === id);
        if (index !== -1) {
            this.data[index] = { ...updatedGame, id };
            this.render();
        }
    },

    deleteGame(id) {
        if (confirm('确定要删除这个游戏记录吗？🎀')) {
            this.data = this.data.filter(g => g.id !== id);
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
            const searchable = [
                game.title,
                game.writer,
                game.artist,
                game.developer,
                game.voiceActors,
                game.platform
            ].join(' ').toLowerCase();
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

                card.innerHTML = `
                    ${imgHtml}
                    <div class="card-info">
                        <div class="card-title">${this.escapeHtml(game.title) || '未命名游戏'}</div>
                        <div class="card-meta">${this.escapeHtml(game.writer) || '未知剧本'}</div>
                    </div>
                `;
                
                grid.appendChild(card);
            });
        }
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
        
        const preview = document.getElementById('previewImage');
        preview.src = '';
        preview.classList.add('hidden');
        document.getElementById('uploadPlaceholder').classList.remove('hidden');
        
        this.setRating(0);
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
            voiceActors: document.getElementById('voiceActors').value.trim(),
            developer: document.getElementById('developer').value.trim(),
            releaseDate: document.getElementById('releaseDate').value.trim(),
            platform: document.getElementById('platform').value.trim(),
            playTime: document.getElementById('playTime').value.trim(),
            rating: document.getElementById('rating').value,
            review: document.getElementById('review').value.trim(),
            image: this.tempImageBase64
        };

        // 验证必填
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
        
        // 填充数据
        document.getElementById('detailTitle').textContent = game.title || '未命名';
        document.getElementById('detailTitleOverlay').textContent = game.title || '未命名';
        document.getElementById('detailImage').src = game.image || '';
        document.getElementById('detailImage').style.display = game.image ? 'block' : 'none';
        document.getElementById('detailArtist').textContent = game.artist || '-';
        document.getElementById('detailWriter').textContent = game.writer || '-';
        document.getElementById('detailVoice').textContent = game.voiceActors || '-';
        document.getElementById('detailDev').textContent = game.developer || '-';
        document.getElementById('detailDate').textContent = game.releaseDate || '-';
        document.getElementById('detailPlatform').textContent = game.platform || '-';
        document.getElementById('detailTime').textContent = game.playTime || '-';
        document.getElementById('detailReview').textContent = game.review || '暂无感想';

        // 渲染星级
        const ratingContainer = document.getElementById('detailRating');
        ratingContainer.innerHTML = '';
        const stars = parseInt(game.rating) || 0;
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('span');
            star.textContent = i < stars ? '★' : '☆';
            star.style.color = i < stars ? '#FFD700' : '#ddd';
            ratingContainer.appendChild(star);
        }

        document.getElementById('detailModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    // ===== 编辑和删除当前游戏 =====
    editCurrentGame() {
        const game = this.data.find(g => g.id === this.currentDetailId);
        if (!game) return;

        this.closeModal('detail');
        this.resetForm();

        // 填充表单
        document.getElementById('gameId').value = game.id;
        document.getElementById('title').value = game.title || '';
        document.getElementById('artist').value = game.artist || '';
        document.getElementById('writer').value = game.writer || '';
        document.getElementById('voiceActors').value = game.voiceActors || '';
        document.getElementById('developer').value = game.developer || '';
        document.getElementById('releaseDate').value = game.releaseDate || '';
        document.getElementById('platform').value = game.platform || '';
        document.getElementById('playTime').value = game.playTime || '';
        document.getElementById('review').value = game.review || '';
        
        this.setRating(game.rating || 0);

        if (game.image) {
            this.tempImageBase64 = game.image;
            const preview = document.getElementById('previewImage');
            preview.src = game.image;
            preview.classList.remove('hidden');
            document.getElementById('uploadPlaceholder').classList.add('hidden');
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
        
        const dataStr = JSON.stringify(this.data, null, 2);
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
                if (!Array.isArray(json)) {
                    throw new Error('格式错误');
                }

                // 简单验证数据结构
                const validGames = json.filter(g => g.title);
                
                if (validGames.length === 0) {
                    alert('没有找到有效的游戏数据！');
                    return;
                }

                if (confirm(`确定导入 ${validGames.length} 条游戏记录吗？这将覆盖当前所有数据！`)) {
                    this.data = validGames;
                    this.render();
                    alert(`成功导入 ${validGames.length} 条记录！🎀`);
                }
            } catch (err) {
                console.error(err);
                alert('导入失败：文件格式不正确或已损坏');
            }
            input.value = ''; // 重置input
        };
        reader.readAsText(file);
    }
};

// ===== 启动应用 =====
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});


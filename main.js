// AI图像生成器 Pro - 主要JavaScript文件
// 重新设计版，修复所有已知问题，提供更稳定的体验

class AIGeneratorPro {
    constructor() {
        this.isGenerating = false;
        this.currentImage = null;
        this.history = [];
        this.favorites = [];
        this.stats = {};
        this.settings = {};
        this.apiKey = null;
        this.apiHealth = 'unknown';
        this.generationQueue = [];
        
        // API配置
        this.apiConfigs = {
            'flux-schnell': {
                name: 'FLUX.1 Schnell',
                url: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
                timeout: 30000,
                maxRetries: 3
            },
            'sdxl-lightning': {
                name: 'SDXL Lightning',
                url: 'https://api-inference.huggingface.co/models/ByteDance/SDXL-Lightning',
                timeout: 20000,
                maxRetries: 2
            },
            'hunyuan-image': {
                name: 'Hunyuan Image',
                url: 'https://api-inference.huggingface.co/models/tencent/HunyuanImage-3.0',
                timeout: 25000,
                maxRetries: 2
            },
            'stable-diffusion': {
                name: 'Stable Diffusion 2.1',
                url: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1',
                timeout: 40000,
                maxRetries: 3
            }
        };
        
        this.currentModel = 'flux-schnell';
        
        // 初始化应用
        this.init();
    }
    
    async init() {
        try {
            this.showLoadingOverlay();
            
            // 初始化数据存储
            await this.initializeStorage();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            // 启动后台服务
            this.startBackgroundServices();
            
            // 加载示例数据
            await this.loadExampleData();
            
            this.hideLoadingOverlay();
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.hideLoadingOverlay();
            this.showNotification('应用初始化失败，请刷新页面重试', 'error');
        }
    }
    
    async initializeStorage() {
        // 初始化本地存储
        this.history = this.loadFromStorage('ai_generator_history', []);
        this.favorites = this.loadFromStorage('ai_generator_favorites', []);
        this.stats = this.loadFromStorage('ai_generator_stats', {
            totalGenerated: 0,
            todayGenerated: 0,
            totalFavorites: 0,
            lastReset: Date.now()
        });
        this.settings = this.loadFromStorage('ai_generator_settings', {
            autoSave: true,
            autoDownload: false,
            showInfo: true,
            enableAnimations: true,
            darkMode: true
        });
        this.apiKey = this.loadFromStorage('ai_generator_api_key', null);
        
        // 数据迁移和清理
        await this.migrateData();
        await this.cleanupData();
    }
    
    setupEventListeners() {
        // 生成按钮
        document.getElementById('generate-btn').addEventListener('click', () => this.handleGenerate());
        
        // 参数控制
        document.getElementById('steps').addEventListener('input', (e) => {
            document.getElementById('steps-value').textContent = e.target.value;
        });
        
        document.getElementById('cfg').addEventListener('input', (e) => {
            document.getElementById('cfg-value').textContent = e.target.value;
        });
        
        // 随机种子
        document.getElementById('random-seed').addEventListener('click', () => {
            const seed = Math.floor(Math.random() * 999999);
            document.getElementById('seed').value = seed;
        });
        
        // 高级选项切换
        document.getElementById('advanced-toggle').addEventListener('click', () => {
            const options = document.getElementById('advanced-options');
            const arrow = document.querySelector('#advanced-toggle span:last-child');
            
            if (options.classList.contains('hidden')) {
                options.classList.remove('hidden');
                arrow.style.transform = 'rotate(180deg)';
            } else {
                options.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
        
        // API密钥管理
        document.getElementById('save-api-key').addEventListener('click', () => this.handleApiKeySave());
        document.getElementById('test-api').addEventListener('click', () => this.testApiConnection());
        
        // 风格选择
        document.querySelectorAll('.style-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                // 添加选择动画
                anime({
                    targets: card,
                    scale: [1, 1.05, 1],
                    duration: 300,
                    easing: 'easeOutElastic(1, .6)'
                });
            });
        });
        
        // 模板按钮
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.dataset.template;
                this.applyTemplate(template);
            });
        });
        
        // 快捷工具
        document.getElementById('enhance-prompt').addEventListener('click', () => this.enhancePrompt());
        document.getElementById('random-prompt').addEventListener('click', () => this.generateRandomPrompt());
        
        // 操作按钮
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('favorite-btn').addEventListener('click', () => this.toggleFavorite());
        document.getElementById('edit-btn').addEventListener('click', () => this.editImage());
        document.getElementById('share-btn').addEventListener('click', () => this.shareImage());
        
        // 设置按钮
        document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.closeSettings());
        
        // 历史记录
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey && !this.isGenerating) {
                this.handleGenerate();
            }
        });
        
        // 模型选择
        document.getElementById('model-select').addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });
    }
    
    initializeUI() {
        // 初始化动画
        this.initializeAnimations();
        
        // 设置神经网络背景
        this.setupNeuralBackground();
        
        // 更新UI状态
        this.updateStats();
        this.loadRecentHistory();
        this.initializeChart();
        this.updateApiStatus();
        
        // 初始化设置
        this.initializeSettings();
    }
    
    initializeAnimations() {
        // Hero标题动画
        anime({
            targets: '#hero-title',
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 1000,
            easing: 'easeOutExpo',
            delay: 200
        });
        
        // 统计卡片动画
        anime({
            targets: '.glass-effect',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            delay: anime.stagger(100, {start: 400}),
            easing: 'easeOutExpo'
        });
        
        // 风格卡片悬停效果
        document.querySelectorAll('.style-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (this.settings.enableAnimations) {
                    anime({
                        targets: card,
                        scale: 1.05,
                        duration: 200,
                        easing: 'easeOutQuad'
                    });
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (this.settings.enableAnimations) {
                    anime({
                        targets: card,
                        scale: 1,
                        duration: 200,
                        easing: 'easeOutQuad'
                    });
                }
            });
        });
    }
    
    setupNeuralBackground() {
        // 使用p5.js创建动态神经网络背景
        const sketch = (p) => {
            let nodes = [];
            let mouseEffect = { x: 0, y: 0, strength: 0 };
            
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('neural-background');
                
                // 创建节点
                for (let i = 0; i < 80; i++) {
                    nodes.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.3, 0.3),
                        vy: p.random(-0.3, 0.3),
                        size: p.random(1, 3),
                        alpha: p.random(0.3, 0.8)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                // 更新鼠标效果
                mouseEffect.x = p.lerp(mouseEffect.x, p.mouseX, 0.05);
                mouseEffect.y = p.lerp(mouseEffect.y, p.mouseY, 0.05);
                mouseEffect.strength = p.lerp(mouseEffect.strength, p.mouseIsPressed ? 150 : 100, 0.1);
                
                // 更新节点位置
                nodes.forEach(node => {
                    // 基础移动
                    node.x += node.vx;
                    node.y += node.vy;
                    
                    // 鼠标交互
                    const mouseDist = p.dist(node.x, node.y, mouseEffect.x, mouseEffect.y);
                    if (mouseDist < mouseEffect.strength) {
                        const force = (mouseEffect.strength - mouseDist) / mouseEffect.strength;
                        const angle = p.atan2(node.y - mouseEffect.y, node.x - mouseEffect.x);
                        node.vx += p.cos(angle) * force * 0.01;
                        node.vy += p.sin(angle) * force * 0.01;
                    }
                    
                    // 边界反弹
                    if (node.x < 0 || node.x > p.width) node.vx *= -0.8;
                    if (node.y < 0 || node.y > p.height) node.vy *= -0.8;
                    
                    // 速度衰减
                    node.vx *= 0.99;
                    node.vy *= 0.99;
                    
                    // 保持在边界内
                    node.x = p.constrain(node.x, 0, p.width);
                    node.y = p.constrain(node.y, 0, p.height);
                });
                
                // 绘制连接线
                p.stroke(0, 212, 255, 20);
                p.strokeWeight(0.5);
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dist = p.dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        if (dist < 120) {
                            const alpha = p.map(dist, 0, 120, 60, 0);
                            p.stroke(0, 212, 255, alpha);
                            p.line(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                        }
                    }
                }
                
                // 绘制节点
                p.noStroke();
                nodes.forEach(node => {
                    p.fill(139, 92, 246, node.alpha * 255);
                    p.circle(node.x, node.y, node.size);
                });
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };
        
        new p5(sketch);
    }
    
    async handleGenerate() {
        if (this.isGenerating) {
            this.showNotification('正在生成中，请稍候...', 'info');
            return;
        }
        
        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            this.showNotification('请输入提示词', 'error');
            this.shakeElement(document.getElementById('prompt-input'));
            return;
        }
        
        this.isGenerating = true;
        this.updateGenerateButton(true);
        this.showProgress(true);
        
        const params = this.getGenerationParams();
        const startTime = Date.now();
        
        try {
            let result;
            
            // 如果有API密钥，尝试使用真实API
            if (this.apiKey && this.apiHealth !== 'failed') {
                try {
                    result = await this.generateWithAPI(params);
                } catch (apiError) {
                    console.warn('API生成失败，切换到演示模式:', apiError);
                    this.apiHealth = 'failed';
                    this.updateApiStatus();
                    result = await this.generateDemo(params);
                }
            } else {
                // 使用演示模式
                result = await this.generateDemo(params);
            }
            
            if (result) {
                const endTime = Date.now();
                result.generationTime = ((endTime - startTime) / 1000).toFixed(1);
                
                await this.displayGeneratedImage(result);
                this.saveToHistory(result);
                this.updateStats();
                
                this.showNotification(`生成完成！用时 ${result.generationTime}秒`, 'success');
            }
            
        } catch (error) {
            console.error('生成过程失败:', error);
            this.showNotification('生成失败，请重试', 'error');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButton(false);
            this.showProgress(false);
        }
    }
    
    async generateWithAPI(params) {
        const apiConfig = this.apiConfigs[this.currentModel];
        if (!apiConfig) {
            throw new Error('未找到API配置');
        }
        
        const requestBody = {
            inputs: params.prompt,
            parameters: {
                guidance_scale: params.cfg,
                num_inference_steps: params.steps,
                negative_prompt: params.negativePrompt || '',
                width: parseInt(params.resolution.split('x')[0]),
                height: parseInt(params.resolution.split('x')[1]),
                seed: params.seed ? parseInt(params.seed) : undefined
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        };
        
        let lastError;
        for (let attempt = 1; attempt <= apiConfig.maxRetries; attempt++) {
            try {
                this.updateProgress((attempt - 1) * 25, `正在连接API... (尝试 ${attempt}/${apiConfig.maxRetries})`);
                
                const response = await fetch(apiConfig.url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'X-Wait-For-Model': 'true'
                    },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(apiConfig.timeout)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API请求失败: ${response.status} ${errorText}`);
                }
                
                const blob = await response.blob();
                if (!blob || blob.size === 0) {
                    throw new Error('API返回空数据');
                }
                
                return {
                    type: 'api',
                    blob: blob,
                    params: params,
                    timestamp: Date.now(),
                    model: this.currentModel
                };
                
            } catch (error) {
                lastError = error;
                console.warn(`API尝试 ${attempt} 失败:`, error);
                
                if (attempt < apiConfig.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
            }
        }
        
        throw lastError;
    }
    
    async generateDemo(params) {
        // 模拟生成过程
        const steps = 100;
        const duration = 4000; // 4秒演示时间
        const stepDuration = duration / steps;
        
        const statuses = [
            '正在分析提示词...',
            '初始化AI模型...',
            '构建神经网络...',
            '应用艺术风格...',
            '生成基础图像...',
            '添加细节纹理...',
            '优化色彩平衡...',
            '最终质量检查...'
        ];
        
        for (let i = 0; i <= steps; i++) {
            const progress = (i / steps) * 100;
            const statusIndex = Math.floor((i / steps) * statuses.length);
            
            this.updateProgress(progress, statuses[statusIndex] || '生成中...');
            
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
        
        // 生成演示图像
        const canvas = await this.generateDemoImage(params);
        
        return {
            type: 'demo',
            canvas: canvas,
            params: params,
            timestamp: Date.now(),
            model: 'demo'
        };
    }
    
    async generateDemoImage(params) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const [width, height] = params.resolution.split('x').map(Number);
            canvas.width = width;
            canvas.height = height;
            
            // 基于参数的确定性生成
            const hash = this.hashCode(params.prompt + params.style + params.resolution);
            const random = this.seededRandom(hash);
            
            // 创建渐变背景
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            const hue1 = random() * 360;
            const hue2 = (hue1 + 120 + random() * 120) % 360;
            const sat1 = 60 + random() * 20;
            const sat2 = 40 + random() * 30;
            
            gradient.addColorStop(0, `hsl(${hue1}, ${sat1}%, ${30 + random() * 20}%)`);
            gradient.addColorStop(0.5, `hsl(${hue2}, ${sat2}%, ${20 + random() * 30}%)`);
            gradient.addColorStop(1, `hsl(${hue1}, ${sat1}%, ${10 + random() * 20}%)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 根据风格添加不同的图案
            this.addStyleSpecificElements(ctx, width, height, params, random);
            
            // 添加噪点效果
            this.addNoiseEffect(ctx, width, height, random);
            
            resolve(canvas);
        });
    }
    
    addStyleSpecificElements(ctx, width, height, params, random) {
        const style = params.style;
        
        switch (style) {
            case 'realistic':
                this.addRealisticElements(ctx, width, height, random);
                break;
            case 'anime':
                this.addAnimeElements(ctx, width, height, random);
                break;
            case 'abstract':
                this.addAbstractElements(ctx, width, height, random);
                break;
            case 'cyberpunk':
                this.addCyberpunkElements(ctx, width, height, random);
                break;
            case 'fantasy':
                this.addFantasyElements(ctx, width, height, random);
                break;
            default:
                this.addGenericElements(ctx, width, height, random);
        }
    }
    
    addRealisticElements(ctx, width, height, random) {
        // 添加光影效果
        const lightGradient = ctx.createRadialGradient(
            width * 0.3, height * 0.2, 0,
            width * 0.3, height * 0.2, Math.max(width, height)
        );
        lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = lightGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加结构元素
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${random() * 0.1})`;
            ctx.fillRect(
                random() * width,
                random() * height,
                random() * width * 0.3,
                random() * height * 0.3
            );
        }
    }
    
    addAnimeElements(ctx, width, height, random) {
        // 添加大眼睛效果
        const eyeY = height * 0.4;
        const eyeSize = Math.min(width, height) * 0.15;
        
        // 左眼
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.ellipse(width * 0.3, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 右眼
        ctx.beginPath();
        ctx.ellipse(width * 0.7, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳孔
        ctx.fillStyle = `hsl(${200 + random() * 60}, 80%, 50%)`;
        ctx.beginPath();
        ctx.arc(width * 0.3, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width * 0.7, eyeY, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(width * 0.32, eyeY - eyeSize * 0.2, eyeSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(width * 0.72, eyeY - eyeSize * 0.2, eyeSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    addAbstractElements(ctx, width, height, random) {
        // 添加几何形状
        for (let i = 0; i < 15; i++) {
            ctx.fillStyle = `hsla(${random() * 360}, 70%, 60%, ${random() * 0.4})`;
            
            const shapeType = Math.floor(random() * 3);
            const x = random() * width;
            const y = random() * height;
            const size = random() * 80 + 20;
            
            switch (shapeType) {
                case 0: // 圆形
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 1: // 矩形
                    ctx.fillRect(x - size/2, y - size/2, size, size);
                    break;
                case 2: // 三角形
                    ctx.beginPath();
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x - size, y + size);
                    ctx.lineTo(x + size, y + size);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        }
        
        // 添加连接线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(random() * width, random() * height);
            ctx.lineTo(random() * width, random() * height);
            ctx.stroke();
        }
    }
    
    addCyberpunkElements(ctx, width, height, random) {
        // 添加霓虹网格
        ctx.strokeStyle = `rgba(0, 255, 255, ${random() * 0.3 + 0.1})`;
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 添加霓虹灯效果
        for (let i = 0; i < 8; i++) {
            const x = random() * width;
            const y = random() * height;
            const radius = random() * 30 + 10;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${random() * 0.5 + 0.3})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    addFantasyElements(ctx, width, height, random) {
        // 添加魔法粒子
        for (let i = 0; i < 20; i++) {
            const x = random() * width;
            const y = random() * height;
            const radius = random() * 5 + 2;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${random() * 0.8 + 0.2})`);
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 添加魔法阵
        const centerX = width * 0.5;
        const centerY = height * 0.7;
        const maxRadius = Math.min(width, height) * 0.3;
        
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2;
        
        for (let r = maxRadius * 0.3; r <= maxRadius; r += maxRadius * 0.2) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 添加符文
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * maxRadius * 0.8;
            const y = centerY + Math.sin(angle) * maxRadius * 0.8;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${random() * 0.5 + 0.3})`;
            ctx.font = '20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', x, y);
        }
    }
    
    addGenericElements(ctx, width, height, random) {
        // 添加通用的装饰元素
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(random() * width, random() * height, random() * 30 + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 添加线条装饰
        ctx.strokeStyle = `rgba(255, 255, 255, ${random() * 0.1 + 0.05})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(random() * width, random() * height);
            ctx.lineTo(random() * width, random() * height);
            ctx.stroke();
        }
    }
    
    addNoiseEffect(ctx, width, height, random) {
        // 添加轻微的噪点效果
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (random() < 0.01) { // 1%的像素添加噪点
                const noise = (random() - 0.5) * 20;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    async displayGeneratedImage(result) {
        const imageDisplay = document.getElementById('image-display');
        imageDisplay.innerHTML = '';
        imageDisplay.classList.add('active');
        
        let img;
        
        if (result.type === 'api' && result.blob) {
            // 显示API生成的图像
            img = document.createElement('img');
            img.src = URL.createObjectURL(result.blob);
        } else if (result.type === 'demo' && result.canvas) {
            // 显示演示生成的图像
            img = document.createElement('img');
            img.src = result.canvas.toDataURL();
        }
        
        if (img) {
            img.className = 'w-full h-full object-cover rounded-xl';
            img.alt = '生成的图像';
            
            // 等待图像加载完成
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // 即使加载失败也继续
            });
            
            imageDisplay.appendChild(img);
            
            // 保存当前图像
            this.currentImage = result;
            
            // 启用操作按钮
            this.enableImageActions();
            
            // 显示生成信息
            this.showGenerationInfo(result);
            
            // 添加生成成功动画
            if (this.settings.enableAnimations) {
                anime({
                    targets: imageDisplay,
                    scale: [0.9, 1],
                    opacity: [0.7, 1],
                    duration: 600,
                    easing: 'easeOutElastic(1, .6)'
                });
            }
        }
    }
    
    enableImageActions() {
        const buttons = ['download-btn', 'favorite-btn', 'edit-btn', 'share-btn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            btn.disabled = false;
            btn.classList.remove('opacity-50');
        });
    }
    
    showGenerationInfo(result) {
        if (!this.settings.showInfo) return;
        
        const infoContainer = document.getElementById('generation-info');
        const modelName = this.apiConfigs[result.model]?.name || '演示模式';
        const styleName = this.getStyleName(result.params.style);
        
        document.getElementById('info-model').textContent = modelName;
        document.getElementById('info-style').textContent = styleName;
        document.getElementById('info-resolution').textContent = result.params.resolution;
        document.getElementById('info-time').textContent = result.generationTime + 's';
        
        infoContainer.classList.remove('hidden');
    }
    
    getGenerationParams() {
        const selectedStyle = document.querySelector('.style-card.active').dataset.style;
        const stylePrompts = {
            'realistic': 'photorealistic, high quality, detailed, 4k, ultra realistic',
            'anime': 'anime style, manga style, colorful, kawaii, detailed anime art',
            'abstract': 'abstract art, creative, artistic, modern art, contemporary',
            'cyberpunk': 'cyberpunk style, neon lights, futuristic, high tech, dystopian',
            'oil-painting': 'oil painting style, classical art, painterly, artistic masterpiece',
            'watercolor': 'watercolor painting style, soft colors, artistic, dreamy',
            'photography': 'professional photography, sharp focus, detailed, high resolution',
            'fantasy': 'fantasy art, magical, mystical, enchanted, mythical creatures'
        };
        
        const basePrompt = document.getElementById('prompt-input').value.trim();
        const stylePrompt = stylePrompts[selectedStyle] || '';
        const fullPrompt = `${basePrompt}, ${stylePrompt}`.trim();
        
        return {
            prompt: fullPrompt,
            negativePrompt: document.getElementById('negative-prompt').value.trim(),
            resolution: document.getElementById('resolution').value,
            steps: parseInt(document.getElementById('steps').value),
            cfg: parseFloat(document.getElementById('cfg').value),
            seed: document.getElementById('seed').value || Math.floor(Math.random() * 999999),
            sampler: document.getElementById('sampler').value,
            style: selectedStyle,
            model: this.currentModel
        };
    }
    
    updateGenerateButton(generating) {
        const btn = document.getElementById('generate-btn');
        if (generating) {
            btn.innerHTML = `
                <span class="flex items-center justify-center">
                    <span class="mr-2 animate-spin">⏳</span>
                    生成中...
                </span>
            `;
            btn.disabled = true;
            btn.classList.add('opacity-75');
        } else {
            btn.innerHTML = `
                <span class="flex items-center justify-center">
                    <span class="mr-2 text-lg">✨</span>
                    开始生成
                </span>
            `;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    }
    
    showProgress(show) {
        const container = document.getElementById('progress-container');
        const imageDisplay = document.getElementById('image-display');
        
        if (show) {
            container.classList.remove('hidden');
            imageDisplay.classList.add('loading');
        } else {
            container.classList.add('hidden');
            imageDisplay.classList.remove('loading');
        }
    }
    
    updateProgress(percent, status) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressStatus = document.getElementById('progress-status');
        
        // 平滑进度更新
        anime({
            targets: progressBar,
            width: `${percent}%`,
            duration: 300,
            easing: 'easeOutQuad'
        });
        
        progressText.textContent = `${Math.round(percent)}%`;
        progressStatus.textContent = status;
    }
    
    // 工具函数
    applyTemplate(template) {
        const templates = {
            'portrait': '专业人像摄影，柔和光线，浅景深，高分辨率，细节丰富，美丽的人物肖像，时尚摄影风格',
            'landscape': '壮丽的自然风光，远山，湖泊，天空，风景画，宁静优美，色彩丰富，黄金时刻光线',
            'fantasy': '奇幻世界，魔法森林，神秘生物，梦幻场景，绚烂色彩，超现实主义，魔法氛围',
            'abstract': '抽象艺术作品，几何图形，流动线条，鲜艳色彩，现代艺术风格，富有表现力',
            'architecture': '现代建筑设计，几何结构，玻璃幕墙，城市景观，未来主义风格，光影效果',
            'anime': '可爱的动漫角色，大眼睛，彩色头发，日系画风，萌系风格，细节丰富'
        };
        
        document.getElementById('prompt-input').value = templates[template] || '';
        
        // 添加输入动画
        if (this.settings.enableAnimations) {
            anime({
                targets: '#prompt-input',
                scale: [1, 1.02, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
    }
    
    enhancePrompt() {
        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            this.showNotification('请先输入基础提示词', 'error');
            return;
        }
        
        // 智能增强提示词
        const enhancements = [
            'high quality, detailed, 4k, ultra realistic',
            'professional artwork, masterpiece, best quality',
            'detailed lighting, beautiful composition',
            'sharp focus, intricate details, vibrant colors'
        ];
        
        const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
        const enhancedPrompt = `${prompt}, ${randomEnhancement}`;
        
        document.getElementById('prompt-input').value = enhancedPrompt;
        this.showNotification('提示词已优化增强！', 'success');
    }
    
    generateRandomPrompt() {
        const subjects = ['神秘森林', '未来城市', '古代遗迹', '太空站', '海底世界', '魔法学院', '机械工厂', '云端城堡'];
        const styles = ['赛博朋克风格', '蒸汽朋克风格', '极简主义风格', '巴洛克风格', '未来主义风格', '复古风格', '超现实主义风格'];
        const moods = ['宁静祥和', '紧张刺激', '神秘莫测', '温暖舒适', '冷峻严肃', '欢快活泼', '庄严肃穆'];
        const times = ['黎明时分', '正午阳光', '黄昏时刻', '深夜星空', '暴风雨中', '雪天美景'];
        
        const prompt = `${subjects[Math.floor(Math.random() * subjects.length)]}，${styles[Math.floor(Math.random() * styles.length)]}，${moods[Math.floor(Math.random() * moods.length)]}，${times[Math.floor(Math.random() * times.length)]}，4K超高清`;
        
        document.getElementById('prompt-input').value = prompt;
        this.showNotification('已生成随机提示词！', 'success');
    }
    
    async downloadImage() {
        if (!this.currentImage) {
            this.showNotification('没有可下载的图像', 'error');
            return;
        }
        
        try {
            let dataURL;
            let filename = `ai-generated-${Date.now()}.png`;
            
            if (this.currentImage.type === 'api' && this.currentImage.blob) {
                // 下载API生成的图像
                const link = document.createElement('a');
                link.href = URL.createObjectURL(this.currentImage.blob);
                link.download = filename;
                link.click();
                URL.revokeObjectURL(link.href);
            } else if (this.currentImage.type === 'demo' && this.currentImage.canvas) {
                // 下载演示生成的图像
                dataURL = this.currentImage.canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = filename;
                link.click();
            }
            
            this.showNotification('图像已下载', 'success');
            
            // 记录下载统计
            this.stats.totalDownloads = (this.stats.totalDownloads || 0) + 1;
            this.saveToStorage('ai_generator_stats', this.stats);
            
        } catch (error) {
            console.error('下载失败:', error);
            this.showNotification('下载失败，请重试', 'error');
        }
    }
    
    toggleFavorite() {
        if (!this.currentImage) {
            this.showNotification('没有可收藏的图像', 'error');
            return;
        }
        
        const imageId = this.currentImage.timestamp;
        const isFavorited = this.favorites.some(fav => fav.timestamp === imageId);
        
        if (isFavorited) {
            this.favorites = this.favorites.filter(fav => fav.timestamp !== imageId);
            this.showNotification('已取消收藏', 'info');
        } else {
            this.favorites.push(this.currentImage);
            this.showNotification('已添加到收藏', 'success');
        }
        
        this.saveToStorage('ai_generator_favorites', this.favorites);
        this.updateFavoriteButton();
        this.updateStats();
    }
    
    updateFavoriteButton() {
        if (!this.currentImage) return;
        
        const btn = document.getElementById('favorite-btn');
        const isFavorited = this.favorites.some(fav => fav.timestamp === this.currentImage.timestamp);
        
        if (isFavorited) {
            btn.innerHTML = '⭐ 已收藏';
            btn.classList.add('text-yellow-400');
        } else {
            btn.innerHTML = '⭐ 收藏';
            btn.classList.remove('text-yellow-400');
        }
    }
    
    editImage() {
        if (!this.currentImage) {
            this.showNotification('没有可编辑的图像', 'error');
            return;
        }
        
        this.showNotification('图像编辑功能即将推出', 'info');
    }
    
    shareImage() {
        if (!this.currentImage) {
            this.showNotification('没有可分享的图像', 'error');
            return;
        }
        
        // 简单的分享功能
        if (navigator.share) {
            navigator.share({
                title: 'AI生成的艺术作品',
                text: '看看这个由AI创作的精彩作品！',
                url: window.location.href
            }).catch(err => console.log('分享失败:', err));
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('链接已复制到剪贴板', 'success');
            }).catch(() => {
                this.showNotification('分享功能暂不可用', 'error');
            });
        }
    }
    
    // API管理
    async handleApiKeySave() {
        const apiKeyInput = document.getElementById('api-key-input');
        const key = apiKeyInput.value.trim();
        
        if (!key) {
            this.showNotification('请输入API密钥', 'error');
            return;
        }
        
        // 测试API密钥
        this.apiKey = key;
        const isValid = await this.testApiConnection();
        
        if (isValid) {
            this.saveToStorage('ai_generator_api_key', key);
            this.updateApiStatus();
            this.showNotification('API密钥保存成功！', 'success');
            apiKeyInput.value = '';
        } else {
            this.apiKey = null;
            this.showNotification('API密钥无效，请检查后重试', 'error');
        }
    }
    
    async testApiConnection() {
        if (!this.apiKey) {
            this.showNotification('请先输入API密钥', 'error');
            return false;
        }
        
        try {
            this.updateProgress(0, '正在测试API连接...');
            
            const response = await fetch(this.apiConfigs[this.currentModel].url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (response.ok) {
                this.apiHealth = 'healthy';
                this.updateProgress(100, 'API连接正常');
                return true;
            } else {
                throw new Error(`API测试失败: ${response.status}`);
            }
        } catch (error) {
            console.error('API测试失败:', error);
            this.apiHealth = 'failed';
            return false;
        }
    }
    
    updateApiStatus() {
        const statusElement = document.getElementById('api-status');
        
        if (this.apiKey && this.apiHealth === 'healthy') {
            statusElement.textContent = '已连接';
            statusElement.className = 'text-emerald-400';
        } else if (this.apiKey && this.apiHealth === 'failed') {
            statusElement.textContent = '连接失败';
            statusElement.className = 'text-red-400';
        } else {
            statusElement.textContent = '演示模式';
            statusElement.className = 'text-yellow-400';
        }
    }
    
    // 设置管理
    openSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        
        // 加载当前设置
        document.getElementById('auto-save').checked = this.settings.autoSave;
        document.getElementById('auto-download').checked = this.settings.autoDownload;
        document.getElementById('show-info').checked = this.settings.showInfo;
        document.getElementById('enable-animations').checked = this.settings.enableAnimations;
        document.getElementById('dark-mode').checked = this.settings.darkMode;
    }
    
    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
        
        // 保存设置
        this.settings.autoSave = document.getElementById('auto-save').checked;
        this.settings.autoDownload = document.getElementById('auto-download').checked;
        this.settings.showInfo = document.getElementById('show-info').checked;
        this.settings.enableAnimations = document.getElementById('enable-animations').checked;
        this.settings.darkMode = document.getElementById('dark-mode').checked;
        
        this.saveToStorage('ai_generator_settings', this.settings);
        this.showNotification('设置已保存', 'success');
    }
    
    initializeSettings() {
        // 应用设置
        if (!this.settings.enableAnimations) {
            // 禁用动画
            anime.set('*', { duration: 0 });
        }
        
        // 更新API状态
        this.updateApiStatus();
    }
    
    // 数据管理
    updateStats() {
        const today = new Date().toDateString();
        const todayCount = this.history.filter(item => 
            new Date(item.timestamp).toDateString() === today
        ).length;
        
        document.getElementById('today-count').textContent = todayCount;
        document.getElementById('total-count').textContent = this.history.length;
        document.getElementById('favorite-count').textContent = this.favorites.length;
        
        // 更新成功率（基于最近100次生成）
        const recentHistory = this.history.slice(0, 100);
        const successfulGenerations = recentHistory.filter(item => item.type !== 'failed').length;
        const successRate = recentHistory.length > 0 ? Math.round((successfulGenerations / recentHistory.length) * 100) : 100;
        
        document.getElementById('success-rate').textContent = successRate + '%';
        
        // 更新平均生成时间
        const recentTimes = this.history.slice(0, 20).map(item => parseFloat(item.generationTime) || 3.0);
        const avgTime = recentTimes.length > 0 ? (recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length).toFixed(1) : '3.0';
        document.getElementById('avg-time').textContent = avgTime + 's';
    }
    
    loadRecentHistory() {
        const container = document.getElementById('recent-history');
        
        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <div class="text-2xl mb-2">🎨</div>
                    <p class="text-sm">还没有生成记录</p>
                    <p class="text-xs mt-1">开始创作您的第一幅作品吧！</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.history.slice(0, 8).forEach((item, index) => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item glass-effect rounded-lg p-3 cursor-pointer';
            
            const isFavorite = this.favorites.some(fav => fav.timestamp === item.timestamp);
            const timeAgo = this.getTimeAgo(item.timestamp);
            
            historyElement.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <img src="${item.type === 'api' && item.blob ? URL.createObjectURL(item.blob) : item.dataURL}" 
                             alt="历史图像" class="w-12 h-12 rounded object-cover">
                        ${isFavorite ? '<div class="absolute -top-1 -right-1 text-yellow-400 text-xs">⭐</div>' : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs text-gray-400 truncate">${item.params.prompt.split(',')[0]}</p>
                        <div class="flex items-center justify-between mt-1">
                            <p class="text-xs text-gray-500">${timeAgo}</p>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs text-gray-500">${item.params.resolution}</span>
                                ${item.type === 'api' ? '<span class="text-xs text-emerald-400">API</span>' : '<span class="text-xs text-yellow-400">演示</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            historyElement.addEventListener('click', () => {
                this.loadHistoryItem(item);
            });
            
            container.appendChild(historyElement);
            
            // 添加入场动画
            if (this.settings.enableAnimations) {
                anime({
                    targets: historyElement,
                    opacity: [0, 1],
                    translateX: [30, 0],
                    duration: 400,
                    delay: index * 50,
                    easing: 'easeOutExpo'
                });
            }
        });
    }
    
    loadHistoryItem(item) {
        this.currentImage = item;
        
        const imageDisplay = document.getElementById('image-display');
        imageDisplay.innerHTML = '';
        imageDisplay.classList.add('active');
        
        const img = document.createElement('img');
        img.src = item.type === 'api' && item.blob ? URL.createObjectURL(item.blob) : item.dataURL;
        img.className = 'w-full h-full object-cover rounded-xl';
        img.alt = '历史图像';
        
        imageDisplay.appendChild(img);
        
        // 恢复参数
        document.getElementById('prompt-input').value = item.params.prompt.split(',')[0];
        document.getElementById('resolution').value = item.params.resolution;
        document.getElementById('steps').value = item.params.steps;
        document.getElementById('cfg').value = item.params.cfg;
        document.getElementById('seed').value = item.params.seed;
        document.getElementById('sampler').value = item.params.sampler;
        
        // 更新显示值
        document.getElementById('steps-value').textContent = item.params.steps;
        document.getElementById('cfg-value').textContent = item.params.cfg;
        
        // 设置风格
        document.querySelectorAll('.style-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.style === item.params.style) {
                card.classList.add('active');
            }
        });
        
        // 设置模型
        document.getElementById('model-select').value = item.params.model || 'flux-schnell';
        this.currentModel = item.params.model || 'flux-schnell';
        
        // 启用按钮
        this.enableImageActions();
        this.updateFavoriteButton();
        
        // 显示生成信息
        this.showGenerationInfo(item);
    }
    
    initializeChart() {
        const chartContainer = document.getElementById('generation-chart');
        const chart = echarts.init(chartContainer);
        
        // 生成最近7天的数据
        const dates = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            
            const dayString = date.toDateString();
            const dayCount = this.history.filter(item => 
                new Date(item.timestamp).toDateString() === dayString
            ).length;
            data.push(dayCount);
        }
        
        const option = {
            backgroundColor: 'transparent',
            grid: {
                left: '5%',
                right: '5%',
                top: '10%',
                bottom: '20%'
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { lineStyle: { color: '#4B5563' } },
                axisLabel: { color: '#9CA3AF', fontSize: 10 }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#4B5563' } },
                axisLabel: { color: '#9CA3AF', fontSize: 10 },
                splitLine: { lineStyle: { color: '#374151', opacity: 0.5 } }
            },
            series: [{
                data: data,
                type: 'line',
                smooth: true,
                lineStyle: { 
                    color: '#00D4FF', 
                    width: 2,
                    shadowColor: 'rgba(0, 212, 255, 0.3)',
                    shadowBlur: 10
                },
                itemStyle: { 
                    color: '#00D4FF',
                    borderColor: '#fff',
                    borderWidth: 2
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
                            { offset: 1, color: 'rgba(0, 212, 255, 0.05)' }
                        ]
                    }
                }
            }]
        };
        
        chart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    async loadExampleData() {
        // 如果是首次使用，加载示例数据
        if (this.history.length === 0) {
            const examplePrompts = [
                { prompt: '神秘森林中的精灵城堡，魔法光芒，奇幻风格', style: 'fantasy' },
                { prompt: '未来城市的夜景，霓虹灯光，赛博朋克风格', style: 'cyberpunk' },
                { prompt: '可爱的动漫少女，粉色头发，日系画风', style: 'anime' },
                { prompt: '抽象几何图形，鲜艳色彩，现代艺术', style: 'abstract' },
                { prompt: '写实风格的猫咪肖像，毛发细节，专业摄影', style: 'realistic' }
            ];
            
            for (let i = 0; i < examplePrompts.length; i++) {
                const example = examplePrompts[i];
                const params = {
                    prompt: example.prompt,
                    resolution: '768x512',
                    steps: 25,
                    cfg: 7.5,
                    seed: Math.floor(Math.random() * 999999),
                    sampler: 'euler',
                    style: example.style,
                    model: 'flux-schnell'
                };
                
                // 生成示例图像
                const canvas = await this.generateDemoImage(params);
                
                const historyItem = {
                    type: 'demo',
                    dataURL: canvas.toDataURL(),
                    params: params,
                    timestamp: Date.now() - (i * 24 * 60 * 60 * 1000), // 分散在不同天数
                    generationTime: '2.5',
                    id: Date.now() + i
                };
                
                this.history.push(historyItem);
            }
            
            this.saveToStorage('ai_generator_history', this.history);
            this.loadRecentHistory();
            this.updateStats();
        }
    }
    
    // 后台服务
    startBackgroundServices() {
        // 定期清理旧数据
        setInterval(() => {
            this.cleanupOldData();
        }, 24 * 60 * 60 * 1000); // 每天清理一次
        
        // 定期检查API健康状态
        setInterval(() => {
            if (this.apiKey) {
                this.checkApiHealth();
            }
        }, 5 * 60 * 1000); // 每5分钟检查一次
    }
    
    async cleanupOldData() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        // 清理30天前的历史记录
        this.history = this.history.filter(item => item.timestamp > thirtyDaysAgo);
        this.favorites = this.favorites.filter(item => item.timestamp > thirtyDaysAgo);
        
        this.saveToStorage('ai_generator_history', this.history);
        this.saveToStorage('ai_generator_favorites', this.favorites);
        
        this.updateStats();
    }
    
    async checkApiHealth() {
        if (!this.apiKey) return;
        
        try {
            const response = await fetch(this.apiConfigs[this.currentModel].url, {
                method: 'HEAD',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            this.apiHealth = response.ok ? 'healthy' : 'failed';
        } catch (error) {
            this.apiHealth = 'failed';
        }
        
        this.updateApiStatus();
    }
    
    // 数据迁移和清理
    async migrateData() {
        // 从旧版本迁移数据
        const oldHistory = localStorage.getItem('ai_generator_history');
        const oldFavorites = localStorage.getItem('ai_generator_favorites');
        
        if (oldHistory && !Array.isArray(this.history)) {
            try {
                this.history = JSON.parse(oldHistory);
            } catch (e) {
                console.warn('历史数据迁移失败:', e);
                this.history = [];
            }
        }
        
        if (oldFavorites && !Array.isArray(this.favorites)) {
            try {
                this.favorites = JSON.parse(oldFavorites);
            } catch (e) {
                console.warn('收藏数据迁移失败:', e);
                this.favorites = [];
            }
        }
    }
    
    async cleanupData() {
        // 清理无效的历史记录
        this.history = this.history.filter(item => 
            item && 
            typeof item === 'object' && 
            item.timestamp && 
            item.params && 
            (item.dataURL || (item.type === 'api' && item.blob))
        );
        
        // 清理无效的收藏
        this.favorites = this.favorites.filter(item => 
            item && 
            typeof item === 'object' && 
            item.timestamp && 
            item.params && 
            (item.dataURL || (item.type === 'api' && item.blob))
        );
        
        this.saveToStorage('ai_generator_history', this.history);
        this.saveToStorage('ai_generator_favorites', this.favorites);
    }
    
    clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            return;
        }
        
        this.history = [];
        this.saveToStorage('ai_generator_history', this.history);
        this.loadRecentHistory();
        this.updateStats();
        
        this.showNotification('历史记录已清空', 'success');
    }
    
    // 工具函数
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
    
    seededRandom(seed) {
        let current = seed;
        return () => {
            current = (current * 9301 + 49297) % 233280;
            return current / 233280;
        };
    }
    
    getStyleName(style) {
        const styleNames = {
            'realistic': '写实风格',
            'anime': '动漫风格',
            'abstract': '抽象艺术',
            'cyberpunk': '赛博朋克',
            'oil-painting': '油画风格',
            'watercolor': '水彩风格',
            'photography': '摄影风格',
            'fantasy': '奇幻风格'
        };
        return styleNames[style] || style;
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return new Date(timestamp).toLocaleDateString();
    }
    
    shakeElement(element) {
        if (this.settings.enableAnimations) {
            anime({
                targets: element,
                translateX: [-10, 10, -10, 10, 0],
                duration: 500,
                easing: 'easeInOutQuad'
            });
        }
    }
    
    showLoadingOverlay() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }
    
    hideLoadingOverlay() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }
    
    showWelcomeMessage() {
        if (this.history.length <= 5) { // 新用户
            setTimeout(() => {
                this.showNotification('🎉 欢迎使用AI图像生成器 Pro！开始创作您的第一幅作品吧！', 'success', 5000);
            }, 1000);
        }
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-24 right-6 z-50 notification rounded-lg px-4 py-3 text-sm transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
            error: 'border-red-500/50 text-red-400 bg-red-500/10',
            info: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
            warning: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
        };
        
        notification.classList.add(colors[type] || colors.info);
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // 存储管理
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('存储数据失败:', error);
            this.showNotification('存储空间不足，请清理一些数据', 'warning');
        }
    }
    
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('加载数据失败:', error);
            return defaultValue;
        }
    }
    
    saveToHistory(result) {
        if (!this.settings.autoSave) return;
        
        const historyItem = {
            ...result,
            id: Date.now()
        };
        
        this.history.unshift(historyItem);
        
        // 限制历史记录数量
        if (this.history.length > 100) {
            this.history = this.history.slice(0, 100);
        }
        
        this.saveToStorage('ai_generator_history', this.history);
        
        // 如果是收藏的，也保存到收藏
        if (this.favorites.some(fav => fav.timestamp === result.timestamp)) {
            this.saveToStorage('ai_generator_favorites', this.favorites);
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.aiGenerator = new AIGeneratorPro();
});
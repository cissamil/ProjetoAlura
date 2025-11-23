document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const addBtn = document.getElementById('addBtn');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskXpSelect = document.getElementById('taskXp');

    const levelEl = document.getElementById('level');
    const currentXpEl = document.getElementById('currentXp');
    const maxXpEl = document.getElementById('maxXp');
    const xpFillEl = document.getElementById('xpFill');

    const columns = {
        pendente: document.getElementById('pendente-tasks'),
        andamento: document.getElementById('andamento-tasks'),
        concluido: document.getElementById('concluido-tasks'),
    };

    const counts = {
        pendente: document.getElementById('count-pendente'),
        andamento: document.getElementById('count-andamento'),
        concluido: document.getElementById('count-concluido'),
    };

    const levelUpModal = document.getElementById('levelUpModal');
    const newLevelEl = document.getElementById('newLevel');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const rankingListEl = document.getElementById('ranking-list');

    // --- Estado do Jogo e Tarefas ---
    let player = {
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
    };

    let tasks = [];
    let totalXp = 0;

    // Ranking simulado 
    let ranking = [
        { name: 'Clarissa', xp: 1250 },
        { name: 'GuilhermeLima', xp: 980 },
        { name: 'AhirtonLopes', xp: 750 },
        { name: 'MonicaHillman', xp: 400 },
        { name: 'AluraJunior', xp: 150 },
    ];

    // --- Funções de Lógica ---

    const calculateXpToNextLevel = (level) => 100 * Math.pow(level, 1.5);

    const calculateTotalXp = (level, currentXp) => {
        let total = currentXp;
        for (let i = 1; i < level; i++) {
            total += calculateXpToNextLevel(i);
        }
        return total;
    };

    const updatePlayerStats = () => {
        levelEl.textContent = player.level;
        currentXpEl.textContent = Math.floor(player.xp);
        maxXpEl.textContent = Math.floor(player.xpToNextLevel);
        const xpPercentage = (player.xp / player.xpToNextLevel) * 100;
        xpFillEl.style.width = `${xpPercentage}%`;
    };



    const showLevelUpModal = (newLevel) => {
        newLevelEl.textContent = `Nível ${newLevel}`;
        levelUpModal.classList.remove('hidden');
    };

    const addXp = (amount) => {
        player.xp += amount;
        while (player.xp >= player.xpToNextLevel) {
            player.xp -= player.xpToNextLevel;
            player.level++;
            player.xpToNextLevel = calculateXpToNextLevel(player.level);
            showLevelUpModal(player.level);
        }
        updatePlayerStats();
        updateRanking();
        saveData();
    };

    const createTaskElement = (task) => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.dataset.id = task.id;
        taskEl.style.borderColor = getStatusColor(task.status);

        const xpValue = parseInt(task.xp);
        let xpColor = 'var(--xp-color)';
        if (xpValue === 35) xpColor = 'var(--status-pendente)';
        if (xpValue === 50) xpColor = 'var(--delete-color)';

        taskEl.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-footer">
                <span class="task-xp" style="color: ${xpColor};">${task.xp} XP</span>
                <div class="task-actions">
                    ${task.status !== 'pendente' ? `<button class="move-btn" data-action="move-prev"><i class="fa-solid fa-chevron-left"></i></button>` : ''}
                    <button class="delete-btn" data-action="delete"><i class="fa-solid fa-trash-can"></i></button>
                    ${task.status !== 'concluido' ? `<button class="move-btn" data-action="move-next"><i class="fa-solid fa-chevron-right"></i></button>` : ''}
                </div>
            </div>
        `;

        // Adicionar Event Listeners para os botões da tarefa
        taskEl.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id));
        
        const moveNextBtn = taskEl.querySelector('[data-action="move-next"]');
        if (moveNextBtn) moveNextBtn.addEventListener('click', () => moveTask(task.id, 1));

        const movePrevBtn = taskEl.querySelector('[data-action="move-prev"]');
        if (movePrevBtn) movePrevBtn.addEventListener('click', () => moveTask(task.id, -1));

        return taskEl;
    };

    const getStatusColor = (status) => {
        const colors = {
            pendente: 'var(--status-pendente)',
            andamento: 'var(--status-andamento)',
            concluido: 'var(--status-concluido)',
        };
        return colors[status] || 'var(--tertiary-color)';
    }

    const renderTasks = () => {
        Object.values(columns).forEach(col => col.innerHTML = '');
        tasks.forEach(task => {
            const taskEl = createTaskElement(task);
            columns[task.status].appendChild(taskEl);
        });
        updateCounts();
    };

    const updateRanking = () => {
        if (!rankingListEl) return;

        totalXp = calculateTotalXp(player.level, player.xp);

        // Adiciona o jogador atual ao ranking para ordenação
        const fullRanking = [
            ...ranking,
            { name: 'Você', xp: totalXp, isCurrentUser: true }
        ];

        // Ordena por XP (maior para o menor)
        fullRanking.sort((a, b) => b.xp - a.xp);

        // Renderiza a lista
        rankingListEl.innerHTML = '';
        fullRanking.forEach((user, index) => {
            const item = document.createElement('li');
            item.classList.add('ranking-item');
            if (user.isCurrentUser) item.classList.add('current-user');
            item.innerHTML = `<span class="rank">${index + 1}</span> <span class="name">${user.name}</span> <span class="xp">${Math.floor(user.xp)} XP</span>`;
            rankingListEl.appendChild(item);
        });
    };

    const updateCounts = () => {
        const statusCounts = { pendente: 0, andamento: 0, concluido: 0 };
        tasks.forEach(task => statusCounts[task.status]++);
        Object.keys(counts).forEach(status => {
            counts[status].textContent = statusCounts[status];
        });
    };

    const addTask = () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        if (!title) {
            alert('Por favor, dê um título para a tarefa.');
            return;
        }

        const newTask = {
            id: `task-${Date.now()}`,
            title,
            description: description, // Salva a descrição (pode ser vazia)
            xp: taskXpSelect.value,
            status: 'pendente',
        };

        tasks.push(newTask);
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
        renderTasks();
        saveData();
    };

    const deleteTask = (taskId) => {
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
        saveData();
    };

    const moveTask = (taskId, direction) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const statuses = ['pendente', 'andamento', 'concluido'];
        const currentIndex = statuses.indexOf(task.status);
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < statuses.length) {
            const oldStatus = task.status;
            task.status = statuses[newIndex];

            // Adicionar XP se a tarefa for movida para "Concluído"
            if (task.status === 'concluido' && oldStatus !== 'concluido') {
                addXp(parseInt(task.xp));
            }

            renderTasks();
            saveData();
        }
    };

    // --- Persistência de Dados (LocalStorage) ---

    const saveData = () => {
        localStorage.setItem('aluTaskPlayer', JSON.stringify(player));
        localStorage.setItem('aluTaskTasks', JSON.stringify(tasks));
        localStorage.setItem('aluTaskBots', JSON.stringify(ranking)); // Salva o estado dos bots também
    };

    const loadData = () => {
        const savedPlayer = localStorage.getItem('aluTaskPlayer');
        if (savedPlayer) {
            player = JSON.parse(savedPlayer);
        }

        const savedTasks = localStorage.getItem('aluTaskTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }

        const savedBots = localStorage.getItem('aluTaskBots');
        if (savedBots) {
            ranking = JSON.parse(savedBots);
        }

        // Garante que o xpToNextLevel está correto após carregar
        player.xpToNextLevel = calculateXpToNextLevel(player.level);
        totalXp = calculateTotalXp(player.level, player.xp);
    };

    // --- Inicialização e Event Listeners ---

    addBtn.addEventListener('click', addTask);
    taskTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    closeModalBtn.addEventListener('click', () => {
        levelUpModal.classList.add('hidden');
    });

    const init = () => {
        loadData();
        updatePlayerStats();
        renderTasks();
        updateRanking();
    };

    init();
});
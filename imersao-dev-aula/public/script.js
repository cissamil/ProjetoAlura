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

    // --- Estado Local ---
    let player = {};
    let tasks = [];
    
    // Ranking simulado (pode ser substituído por uma chamada de API no futuro)
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

    const updatePlayerStats = (playerData) => {
        player = playerData;
        levelEl.textContent = player.level;
        currentXpEl.textContent = Math.floor(player.xp);
        maxXpEl.textContent = Math.floor(player.maxXp); // Usando maxXp do servidor
        const xpPercentage = (player.xp / player.maxXp) * 100;
        xpFillEl.style.width = `${xpPercentage}%`;
        updateRanking();
    };

    const showLevelUpModal = (newLevel) => {
        newLevelEl.textContent = `Nível ${newLevel}`;
        levelUpModal.classList.remove('hidden');
    };

    const createTaskElement = (task) => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task');
        taskEl.dataset.id = task.id;
        taskEl.style.borderColor = getStatusColor(task.status);

        taskEl.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
            </div>
            <p class="task-description">${task.project || ''}</p>
            <div class="task-footer">
                <span class="task-xp">${task.xp} XP</span>
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

        const totalXp = calculateTotalXp(player.level, player.xp);

        // Adiciona o jogador atual ao ranking para ordenação
        const fullRanking = [
            ...ranking,
            { name: 'Você', xp: totalXp, isCurrentUser: true } // O nome pode ser editável no futuro
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

    const addTask = async () => {
        const title = taskTitleInput.value.trim();
        const project = taskDescriptionInput.value.trim();
        const xp = parseInt(taskXpSelect.value);

        if (!title) {
            alert('Por favor, dê um título para a tarefa.');
            return;
        }

        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, project, xp })
        });

        const newTask = await response.json();
        tasks.push(newTask);
        renderTasks();

        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
    };

    const deleteTask = async (taskId) => {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
    };

    const moveTask = async (taskId, direction) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const statuses = ['pendente', 'andamento', 'concluido'];
        const currentIndex = statuses.indexOf(task.status);
        const oldLevel = player.level;
        const newIndex = currentIndex + direction;

        if (newIndex >= 0 && newIndex < statuses.length) {
            const newStatus = statuses[newIndex];

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            const { task: updatedTask, player: updatedPlayer } = await response.json();

            // Atualiza a tarefa localmente
            task.status = updatedTask.status;

            // Atualiza os dados do jogador e renderiza tudo
            updatePlayerStats(updatedPlayer);
            renderTasks();

            // Verifica se houve level up para mostrar o modal
            if (updatedPlayer.level > oldLevel) {
                showLevelUpModal(updatedPlayer.level);
            }
        }
    };

    // --- Carregamento Inicial ---

    const loadData = async () => {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error('Não foi possível carregar os dados.');
            
            const data = await response.json();
            tasks = data.tasks;
            updatePlayerStats(data.player);
            renderTasks();
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Não foi possível conectar ao servidor. Verifique se ele está rodando.");
        }
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
    };

    init();
});
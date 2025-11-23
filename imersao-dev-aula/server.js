const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Caminho do arquivo JSON
const tasksFile = path.join(__dirname, 'tasks.json');

// Função para ler dados
function readData() {
    const data = fs.readFileSync(tasksFile, 'utf8');
    return JSON.parse(data);
}

// Função para salvar dados
function saveData(data) {
    fs.writeFileSync(tasksFile, JSON.stringify(data, null, 2));
}

// GET - Buscar todas as tarefas e dados do jogador
app.get('/api/tasks', (req, res) => {
    const data = readData();
    res.json(data);
});

// POST - Criar nova tarefa
app.post('/api/tasks', (req, res) => {
    const data = readData();
    const newTask = {
        id: Date.now(),
        title: req.body.title,
        project: req.body.project,
        status: 'pendente',
        xp: req.body.xp || 20
    };
    
    data.tasks.push(newTask);
    saveData(data);
    res.json(newTask);
});

// PUT - Atualizar status da tarefa
app.put('/api/tasks/:id', (req, res) => {
    const data = readData();
    const taskId = parseInt(req.params.id);
    const task = data.tasks.find(t => t.id === taskId);
    
    if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    // Atualizar status
    const oldStatus = task.status;
    task.status = req.body.status;
    
    // Se moveu para concluído, adicionar XP
    if (oldStatus !== 'concluido' && task.status === 'concluido') {
        data.player.xp += task.xp;
        
        // Verificar level up
        while (data.player.xp >= data.player.maxXp) {
            data.player.xp -= data.player.maxXp;
            data.player.level++;
            data.player.maxXp = Math.floor(data.player.maxXp * 1.5);
        }
    }
    
    // Se voltou de concluído, remover XP
    if (oldStatus === 'concluido' && task.status !== 'concluido') {
        data.player.xp -= task.xp;
        if (data.player.xp < 0) data.player.xp = 0;
    }
    
    saveData(data);
    res.json({ task, player: data.player });
});

// DELETE - Deletar tarefa
app.delete('/api/tasks/:id', (req, res) => {
    const data = readData();
    const taskId = parseInt(req.params.id);
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    data.tasks.splice(taskIndex, 1);
    saveData(data);
    res.json({ message: 'Tarefa deletada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
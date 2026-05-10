// Substitua com suas credenciais do Supabase
const SUPABASE_URL = 'COLE_AQUI_SUA_URL_DO_SUPABASE';
const SUPABASE_KEY = 'COLE_AQUI_SUA_CHAVE_ANON_PUBLIC_DO_SUPABASE';

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Captura os elementos do HTML
const form = document.getElementById('formAgendamento');
const inputData = document.getElementById('data');
const gridHorarios = document.getElementById('gridHorarios');
const inputHoraSelecionada = document.getElementById('horaSelecionada');
const btnConfirmar = document.getElementById('btnConfirmar');
const mensagemDiv = document.getElementById('mensagem');

// Define a grade de horários de funcionamento do salão
const horariosTrabalho = [
    '09:00', '10:00', '11:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00'
];

// 1. Lógica para buscar os horários disponíveis quando a data é escolhida
inputData.addEventListener('change', async (e) => {
    const dataEscolhida = e.target.value;
    if (!dataEscolhida) return;

    // Reseta a interface enquanto carrega
    gridHorarios.innerHTML = '<p class="aviso">Carregando horários...</p>';
    btnConfirmar.disabled = true;
    inputHoraSelecionada.value = '';

    // Consulta no Supabase se já existem agendamentos para esta data
    const { data: agendamentosExistentes, error } = await supabase
        .from('agendamentos')
        .select('hora')
        .eq('data', dataEscolhida);

    if (error) {
        console.error('Erro no banco:', error);
        gridHorarios.innerHTML = '<p class="aviso" style="color: #ef5350;">Erro ao carregar horários.</p>';
        return;
    }

    // Cria uma lista apenas com as horas que já estão ocupadas
    const horariosOcupados = agendamentosExistentes.map(ag => ag.hora);

    // Limpa a grid e gera os botões de hora
    gridHorarios.innerHTML = '';
    
    horariosTrabalho.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-hora';
        btn.textContent = hora;

        // Se a hora já estiver no banco para esse dia, desativa o botão
        if (horariosOcupados.includes(hora)) {
            btn.disabled = true; 
        } else {
            // Se estiver livre, permite clicar
            btn.addEventListener('click', () => selecionarHora(btn, hora));
        }

        gridHorarios.appendChild(btn);
    });
});

// 2. Lógica para selecionar o horário e liberar o botão de envio
function selecionarHora(btnClicado, hora) {
    // Remove a marcação de todos os botões primeiro
    document.querySelectorAll('.btn-hora').forEach(b => b.classList.remove('selecionado'));
    
    // Marca o botão que foi clicado
    btnClicado.classList.add('selecionado');
    
    // Salva a hora no input invisível
    inputHoraSelecionada.value = hora;
    
    // Libera o botão de confirmar agendamento
    btnConfirmar.disabled = false;
}

// 3. Lógica para salvar o agendamento no Supabase
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Agendando...';

    const dados = {
        nome_cliente: document.getElementById('nomeCliente').value,
        servico: document.getElementById('servico').value,
        data: inputData.value,
        hora: inputHoraSelecionada.value,
        status: 'Confirmado' // Padroniza o status inicial
    };

    // Envia os dados para a tabela 'agendamentos'
    const { error } = await supabase
        .from('agendamentos')
        .insert([dados]);

    if (error) {
        mostrarMensagem('Erro ao confirmar o agendamento. Tente novamente.', 'erro');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirmar Agendamento';
    } else {
        mostrarMensagem('Agendamento realizado com sucesso!', 'sucesso');
        form.reset();
        gridHorarios.innerHTML = '<p class="aviso">Selecione uma data primeiro.</p>';
        btnConfirmar.textContent = 'Confirmar Agendamento';
    }
});

// Função para exibir mensagens de sucesso ou erro na tela
function mostrarMensagem(texto, tipo) {
    mensagemDiv.textContent = texto;
    mensagemDiv.className = `mensagem ${tipo}`;
    mensagemDiv.classList.remove('oculto');
    
    // Esconde a mensagem depois de 5 segundos
    setTimeout(() => {
        mensagemDiv.classList.add('oculto');
    }, 5000);
}

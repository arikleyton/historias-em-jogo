// O array agora conta com a propriedade 'url' contendo os links para os documentos HTML
const chapters = [
    { id: 0, title: "Descobrimento do Brasil", subtitle: "Início", status: "active", url: "capitulos/00/cap00.html" },
    { id: 1, title: "A Partida de Lisboa", subtitle: "09 de Março de 1500", status: "available", url: "capitulos/01/cap01.html" },
    { id: 2, title: "A Travessia do Atlântico", subtitle: "Março e Abril de 1500", status: "available", url: "capitulos/02/cap02.html" },
    { id: 3, title: "Terra à Vista!", subtitle: "21 de abril de 1500", status: "available", url: "capitulos/03/cap03.html" },
    { id: 4, title: "O Primeiro Contato", subtitle: "23 e 24 de Abril de 1500", status: "available", url: "capitulos/04/cap04.html" },
    { id: 5, title: "A Primeira Missa", subtitle: "26 de Abril de 1500", status: "available", url: "capitulos/05/cap05.html" },
    { id: 6, title: "A Carta de Caminha", subtitle: "1 de Maio de 1500", status: "available", url: "capitulos/06/cap06.html" },
    { id: 7, title: "A Partida de Cabral", subtitle: "2 de Maio de 1500", status: "available", url: "capitulos/07/cap07.html" },
    { id: 8, title: "Expedições Exploratórias", subtitle: "De 1501 a 1502", status: "available", url: "capitulos/08/cap08.html" },
    { id: 9, title: "As Riquezas Naturais ", subtitle: "1502 em diante", status: "available", url: "capitulos/09/cap09.html" },
    { id: 10, title: "O Escambo", subtitle: "A partir de 1503", status: "available", url: "capitulos/10/cap10.html" },
    { id: 11, title: "Pátria Amada, Brasil!", subtitle: "1511 a 1530", status: "available", url: "capitulos/11/cap11.html" },
    { id: 12, title: "Créditos Finais", subtitle: "Equipe do Projeto", status: "available", url: "creditos.html" }
];

const journeyList = document.getElementById('journey-list');
const contentFrame = document.getElementById('content-frame');

// Renderizar a lista lateral
function renderChapters() {
    journeyList.innerHTML = '';
    chapters.forEach(chapter => {
        const li = document.createElement('li');
        
        let liClass = 'journey-item';
        if (chapter.status === 'active') liClass += ' active';
        if (chapter.status === 'locked') liClass += ' locked';
        li.className = liClass;
        
        li.innerHTML = `
            <div class="node-container">
                <div class="node">${chapter.id}</div>
            </div>
            <div class="item-details-wrapper">
                <span class="item-status">Capítulo Atual</span>
                <h4 class="item-title">${chapter.title}</h4>
                <p class="item-subtitle">${chapter.subtitle}</p>
            </div>
        `;
        
        // Atribui o evento de clique chamando o carregamento da URL
        if(chapter.status !== 'locked') {
            li.onclick = () => loadContent(chapter.id, chapter.url);
        }
        
        journeyList.appendChild(li);
    });
}

// Função para mudar o frame e atualizar a seleção visual
function loadContent(id, url) {
    // Atualiza classes do array
    chapters.forEach(ch => {
        if(ch.status !== 'locked') {
            ch.status = (ch.id === id) ? 'active' : 'available';
        }
    });
    
    renderChapters(); // Atualiza a UI da sidebar
    
    // Altera a fonte do iframe de conteúdo dinâmico
    if(url) {
        contentFrame.src = url;
    }
}

// Alternar a barra lateral
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Inicialização
renderChapters();

// Comportamento responsivo ao carregar
if (window.innerWidth <= 800) {
    document.getElementById('sidebar').classList.add('collapsed');
}
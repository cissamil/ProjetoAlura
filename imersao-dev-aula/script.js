let cardContainer = document.querySelector(".card-container");
let campoBusca = document.querySelector("input");
let dados = [];

async function carregarDados(){
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    renderizarCards(dados);
}

function iniciarBusca(){
    let termoBusca = campoBusca.value.toLowerCase();
    let dadosFiltrados = dados.filter(dado => {
        return dado.nome.toLowerCase().includes(termoBusca);
    });
    renderizarCards(dadosFiltrados);
}

function renderizarCards(dadosParaRenderizar){
    cardContainer.innerHTML = "";
    for (let dado of dadosParaRenderizar){
        let article = document.createElement("article");
        article.innerHTML = `
        <h2> ${dado.nome} </h2>
        <p> ${dado.ano}</p>
        <p>${dado.descricao}</p>
        <a href="${dado.link}" target = "blank" >Saiba mais</a>
        `;
        cardContainer.appendChild(article);
    }
}

 carregarDados();
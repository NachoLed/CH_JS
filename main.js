const arrShares = [
    { ticker: "TSLA", empresa: "Tesla, Inc.", precio: 0},
    { ticker: "NVDA", empresa: "NVIDIA Corp.", precio:0 },
    { ticker: "RGTI", empresa: "Rigetti Computing", precio: 0 },
    { ticker: "YPFD", empresa: "YPF Sociedad Anonima", precio: 0 },
    { ticker: "MELI", empresa: "Mercado Libre", precio: 0 },
    { ticker: "SATL", empresa: "Satellogic Inc.", precio: 0 },
    { ticker: "AAPL", empresa: "Apple Inc.", precio: 0 },
    { ticker: "AMZN", empresa: "Amazon.com, Inc.", precio: 0 },
    { ticker: "GOOGL", empresa: "Alphabet Inc.", precio: 0 }
];

let cartera = {};
let cliente = "";

window.onload = () => {
    cliente = localStorage.getItem('cliente');
    
    arrShares.forEach(stock => {
        const cant = localStorage.getItem(`stock_${stock.ticker}`);
        if (cant) {
            cartera[stock.ticker] = parseInt(cant);
        }
    });

    if (cliente) {
        document.getElementById('display-cliente').innerText = `Hola ${cliente}!`;
        renderCartera();
    } else {
        mostrarModalLogin();
    }

    obtenerCotizaciones();
};

function mostrarModalLogin() {
    Swal.fire({
        title: 'Bienvenido a Palmera Capital 🌴',
        input: 'text',
        inputLabel: 'Ingresa tu nombre de usuario',
        inputPlaceholder: 'Tu nombre aquí...',
        allowOutsideClick: false,
        confirmButtonText: 'Entrar',
        confirmButtonColor: '#27ae60',
        preConfirm: (value) => {
            if (!value) {
                Swal.showValidationMessage('El nombre es obligatorio');
            }
            return value;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            cliente = result.value;
            localStorage.setItem('cliente', cliente);
            document.getElementById('display-cliente').innerText = `Hola ${cliente}!`;
            Swal.fire({
                icon: 'success',
                title: 'Sesión Iniciada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            renderMarket();
        }
    });
}

function obtenerCotizaciones() {
    fetch('./data.json')
        .then(res => res.json())
        .then(data => {
            arrShares.forEach(stock => {
                if (data[stock.ticker]) stock.precio = data[stock.ticker];
            });
            renderMarket();
            renderCartera();
        })
        .catch(() => {
            arrShares.forEach(s => s.precio = 100.00);
            renderMarket();
        });
}

function renderMarket() {
    const grid = document.getElementById("market-grid");
    if (!grid) return;
    grid.innerHTML = "";

    arrShares.forEach(stock => {
        const card = document.createElement("article");
        card.className = "stock-card";
        card.innerHTML = `
            <span class="ticker-name">${stock.ticker}</span>
            <span class="comp-name">${stock.empresa}</span>
            <div class="stock-price">$${stock.precio.toFixed(2)}</div>
        `;

        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group";

        const btnBuy = document.createElement("button");
        btnBuy.className = "btn-buy";
        btnBuy.textContent = "Comprar";
        btnBuy.addEventListener('click', () => operacionSweet(stock.ticker, true));

        const btnSell = document.createElement("button");
        btnSell.className = "btn-sell";
        btnSell.textContent = "Vender";
        btnSell.addEventListener('click', () => operacionSweet(stock.ticker, false));

        btnGroup.append(btnBuy, btnSell);
        card.appendChild(btnGroup);
        grid.appendChild(card);
    });
}

function operacionSweet(ticker, esCompra) {
    Swal.fire({
        title: `${esCompra ? 'Comprar' : 'Vender'} ${ticker}`,
        text: `Indica la cantidad de nominales:`,
        input: 'number',
        inputAttributes: { min: 1, step: 1 },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        confirmButtonColor: esCompra ? '#27ae60' : '#e74c3c',
        cancelButtonText: 'Cancelar',
        preConfirm: (value) => {
            const cantidad = parseInt(value);
            if (!cantidad || cantidad <= 0) {
                Swal.showValidationMessage('Ingresa una cantidad válida');
            }
            return cantidad;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const cantidad = result.value;
            const cantActual = cartera[ticker] || 0;

            if (!esCompra && cantidad > cantActual) {
                Swal.fire('Error', 'No tienes suficientes nominales', 'error');
                return;
            }

            const nuevaCant = esCompra ? cantActual + cantidad : cantActual - cantidad;
            cartera[ticker] = nuevaCant;
            localStorage.setItem(`stock_${ticker}`, nuevaCant);

            Swal.fire({
                icon: 'success',
                title: 'Operación Exitosa',
                text: `${esCompra ? 'Compraste' : 'Vendiste'} ${cantidad} de ${ticker}`,
                timer: 2000,
                showConfirmButton: false
            });

            renderCartera();
        }
    });
}

function renderCartera() {
    const display = document.getElementById("portfolio-display");
    if (!display) return;
    display.innerHTML = "";
    
    const activos = Object.keys(cartera).filter(t => cartera[t] > 0);
    
    if (activos.length === 0) {
        display.innerHTML = '<p class="empty-msg">Tu cartera está vacía</p>';
        return;
    }

    const header = document.createElement("div");
    header.style = "display:grid; grid-template-columns: 1fr 1fr 1fr; font-size: 0.7rem; font-weight: 700; color: #27ae60; border-bottom: 1px solid #444; padding-bottom: 5px; margin-bottom: 10px;";
    header.innerHTML = `<span>ACCIÓN</span> <span style="text-align:center">NOM.</span> <span style="text-align:right">TOTAL USD</span>`;
    display.appendChild(header);

    let granTotal = 0;

    activos.forEach(ticker => {
        const info = arrShares.find(s => s.ticker === ticker);
        const subtotal = (info ? info.precio : 0) * cartera[ticker];
        granTotal += subtotal;

        const row = document.createElement("div");
        row.style = "display:grid; grid-template-columns: 1fr 1fr 1fr; font-size: 0.85rem; margin-bottom: 5px;";
        row.innerHTML = `
            <span>${ticker}</span>
            <span style="text-align:center">${cartera[ticker]}</span>
            <span style="text-align:right">$${subtotal.toLocaleString()}</span>
        `;
        display.appendChild(row);
    });

    const footer = document.createElement("div");
    footer.style = "margin-top: 10px; padding-top: 10px; border-top: 2px solid #27ae60; display: flex; justify-content: space-between; font-weight: 700;";
    footer.innerHTML = `<span>TOTAL:</span> <span>$${granTotal.toLocaleString()}</span>`;
    display.appendChild(footer);
}
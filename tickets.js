const prices = {
    adult: 282.00,
    youth: 168.00,
    children: 80.00
};

const quantities = {
    adult: 0,
    youth: 0,
    children: 0
};

function updateTicket(type, change) {
    const newQuantity = quantities[type] + change;
    if (newQuantity >= 0) {
        quantities[type] = newQuantity;
        document.getElementById(`${type}-quantity`).textContent = newQuantity;
        calculateTotal();
    }
}

function calculateTotal() {
    let total = 0;
    total += quantities.adult * prices.adult;
    total += quantities.youth * prices.youth;
    total += quantities.children * prices.children;
    
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}
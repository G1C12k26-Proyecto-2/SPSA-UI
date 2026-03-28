document.getElementById('hidrico').addEventListener('change', function () {
    const container = document.getElementById('nacientesContainer');
    container.style.display = this.value === '5' ? 'block' : 'none';
});

function calcular() {
    const precioBase = 50000;
    const ha = parseFloat(document.getElementById('hectareas').value) || 0;
    const vegPct = parseFloat(document.getElementById('vegetacion').value) || 0;
    const hidPct = parseFloat(document.getElementById('hidrico').value) || 0;
    const penPct = parseFloat(document.getElementById('pendiente').value) || 0;
    const nacientes = parseInt(document.getElementById('nacientes').value) || 1;

    if (ha <= 0) {
        ShowError('Error', 'Las hectáreas deben ser mayor a 0.');
        return;
    }

    const base = precioBase * ha;
    const hidReal = hidPct === 5 ? hidPct * nacientes : hidPct;

    let totalAjuste = vegPct + hidReal + penPct;
    const topeMaximo = 40;
    const topeAplicado = totalAjuste > topeMaximo;
    if (topeAplicado) totalAjuste = topeMaximo;

    const total = base + (base * totalAjuste / 100);

    document.getElementById('res-base').textContent = '₡' + base.toLocaleString('es-CR');
    document.getElementById('res-veg').textContent = vegPct + '%';
    document.getElementById('res-hid').textContent = hidPct === 5
        ? hidPct + '% × ' + nacientes + ' nacientes = ' + hidReal + '%'
        : hidPct + '%';
    document.getElementById('res-pen').textContent = penPct + '%';
    document.getElementById('res-ajuste').textContent = totalAjuste + '%' + (topeAplicado ? ' (tope)' : '');
    document.getElementById('res-total').textContent = '₡' + Math.round(total).toLocaleString('es-CR');
    document.getElementById('res-aviso').style.display = topeAplicado ? 'block' : 'none';
}
function DetalleFinca() {
    const self = this;

    this.InitView = () => {
        const id = window.location.pathname.split('/').pop();
        self.LoadData(id);
    };

    this.LoadData = (id) => {
        $.ajax({
            url: `${API_URL_BASE}/api/Solicitudes/GetById/${id}`,
            type: 'GET',
            success: (res) => {
                if (res.result === 'ok') {
                    const d = res.data;
                    console.log(d);
                    $('#detNombre').text(d.nombreFinca || '—');
                    $('#detEstado').text(d.estado || '—');
                    $('#detProvincia').text(d.provincia || '—');
                    $('#detCanton').text(d.canton || '—');
                    $('#detDistrito').text(d.distrito || '—');
                    $('#detProvincia2').text(d.provincia || '—');
                    $('#detCanton2').text(d.canton || '—');
                    $('#detDistrito2').text(d.distrito || '—');
                    $('#detHectareas').text(d.hectareasOriginal ?? '—');
                    $('#detVegetacion').text(d.tipoVegetacionOriginal || '—');
                    $('#detPendiente').text(d.pendienteOriginal || '—');
                    $('#detHidrico').text(d.tieneRiosQuebradasOriginal ? 'Sí' : 'No');
                    $('#detNacientes').text(d.cantidadNacientesOriginal ?? '—');
                    $('#detUsoSuelo').text(d.usoSueloOriginal || '—');
                    $('#detFechaSolicitudBanner').text(new Date(d.fechaSolicitud).toLocaleDateString('es-CR'));
                    $('#detPago').text(d.pagoMensual != null ? `₡${d.pagoMensual.toLocaleString('es-CR')}` : '—');
                    $('#detPropietario').text(d.propietario || '—');
                    self.LoadDesglose(d);
                    console.log('docs:', d.documentosUrls, 'fotos:', d.fotosUrls);
                    self.LoadDocumentos(d);
                } else {
                    Swal.fire('Error', res.message || 'No se pudo cargar la finca.', 'error');
                }
            },
            error: () => Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error')
        });
    };

    this.LoadDesglose = (d) => {
        const ha = d.hectareasOriginal || 0;
        const base = ha * 50000;
        const vegPct = d.tipoVegetacionOriginal === 'BOSQUE_PRIMARIO' ? 0.40 :
                       d.tipoVegetacionOriginal === 'BOSQUE_SECUNDARIO' ? 0.30 :
                       d.tipoVegetacionOriginal === 'SISTEMA_AGROFORESTAL' ? 0.20 : 0.10;
        const hidPct = d.tieneRiosQuebradasOriginal ? 0.10 : 0;
        const pendPct = d.pendienteOriginal === 'ESCARPADA' ? 0.15 :
                        d.pendienteOriginal === 'MODERADA' ? 0.10 : 0;
        const totalPct = Math.min(vegPct + hidPct + pendPct, 0.40);
        const total = base + (base * totalPct);
        const fmt = n => '₡' + Math.round(n).toLocaleString('es-CR');
        $('#desgBase').text(fmt(base));
        $('#desgBaseLabel').text('₡50,000 × ' + ha + ' ha');
        $('#desgVeg').text('+' + fmt(base * vegPct));
        $('#desgVegPct').text('+' + (vegPct*100) + '%');
        $('#desgHid').text(hidPct > 0 ? '+' + fmt(base * hidPct) : '₡0');
        $('#desgHidPct').text('+' + (hidPct*100) + '%');
        $('#desgPend').text(pendPct > 0 ? '+' + fmt(base * pendPct) : '₡0');
        $('#desgPendLabel').text(d.pendienteOriginal + ' = ' + (pendPct*100) + '%');
        $('#desgTotalPct').text('Total ajustes: ' + (totalPct*100) + '% · Tope aplicado: 40%');
        $('#desgTotal').text(fmt(total));
    };

    this.LoadDocumentos = (d) => {
        const fotos = d.fotosUrls || [];
        const docs = d.documentosUrls || [];
        if (fotos.length === 0 && docs.length === 0) {
            $('#sinArchivos').show();
            return;
        }
        if (fotos.length > 0) {
            let html = '<p class="fw-medium mb-2"><i class="fas fa-images me-1"></i> Fotografías</p><div class="d-flex flex-wrap gap-2 mb-3">';
            fotos.forEach((url, i) => {
                html += `<a href="${url}" target="_blank"><img src="${url}" alt="Foto ${i+1}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #dee2e6;"></a>`;
            });
            html += '</div>';
            $('#listaFotos').html(html);
        }
        if (docs.length > 0) {
            let html = '';
            docs.forEach((url) => {
                const nombre = decodeURIComponent(url.split('/').pop().split('?')[0]);
                html += `<div class="d-flex align-items-center gap-3 p-2 bg-light rounded mb-2">
                <i class="fas fa-file-pdf text-danger fs-5"></i>
                <div class="flex-grow-1">
                    <div style="font-size:0.82rem;font-weight:500;">${nombre}</div>
                </div>
                <a href="${url}" target="_blank" class="btn btn-outline-psa btn-sm"><i class="fas fa-download"></i></a>
            </div>`;
            });
            $('#listaDocumentos').html(html);
        }
    };
}

$(document).ready(() => { let v = new DetalleFinca(); v.InitView(); });

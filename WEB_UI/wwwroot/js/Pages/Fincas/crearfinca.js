function CrearFinca() {
    let map, marker;

    this.InitView = () => {
        window.crearFincaInstance = this;

        // Chips
        $(document).on('click', '.psa-chip', function () {
            const group = $(this).closest('.psa-chip-group');
            if (group.data('multi') === true) {
                $(this).toggleClass('selected');
            } else {
                group.find('.psa-chip').removeClass('selected');
                $(this).addClass('selected');
            }
        });

        $('#btnEnviar').click(() => this.Submit());
        $('#btnBorrador').click(() => ShowSuccess('Borrador guardado', 'Se guardó como borrador.'));
    };

    this.InitMap = () => {
        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 10.4628, lng: -84.6426 },
            zoom: 9,
            mapTypeId: 'hybrid',
            streetViewControl: false,
            fullscreenControl: true
        });

        map.addListener('click', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            this.SetMarker(lat, lng);
            this.ReverseGeocode(lat, lng);
        });
    };

    this.SetMarker = (lat, lng) => {
        if (marker) marker.setMap(null);
        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            animation: google.maps.Animation.DROP,
            title: 'Ubicación de la finca'
        });
        $('#hfLatitud').val(lat);
        $('#hfLongitud').val(lng);
        $('#lblCoordenadas').text(`${lat.toFixed(6)}° N, ${lng.toFixed(6)}° W`);
    };

    this.ReverseGeocode = (lat, lng) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results[0]) return;

            const components = results[0].address_components;

            const get = (...types) => {
                for (const type of types) {
                    const c = components.find(c => c.types.includes(type));
                    if (c) return c.long_name;
                }
                return '';
            };

            const provincia = get('administrative_area_level_1');
            const canton    = get('administrative_area_level_2', 'locality', 'sublocality_level_1');
            const distrito  = get('administrative_area_level_3', 'neighborhood', 'sublocality_level_2', 'locality');

            $('#ddlProvincia').val(provincia || '');
            $('#ddlCanton').val(canton || '');
            $('#ddlDistrito').val(distrito || '');
        });
    };

    this.Submit = () => {
        const nombre = $('#txtNombre').val();
        const hectareas = $('#txtHectareas').val();
        const lat = $('#hfLatitud').val();
        const lng = $('#hfLongitud').val();
        const idProvincia = $('#ddlProvincia').val();
        const idCanton = $('#ddlCanton').val();
        const idDistrito = $('#ddlDistrito').val();

        if (!nombre || !hectareas) {
            ShowError('Campos requeridos', 'Nombre y hectáreas son obligatorios.');
            return;
        }
        if (!lat || !lng) {
            ShowError('Ubicación requerida', 'Por favor seleccione una ubicación en el mapa.');
            return;
        }
        if (!idProvincia || !idCanton || !idDistrito) {
            ShowError('Ubicación incompleta', 'Seleccione provincia, cantón y distrito.');
            return;
        }

        const servicios = [];
        $('.psa-chip-group[data-field="servicios"] .psa-chip.selected').each(function () {
            servicios.push($(this).data('value'));
        });

        const payload = {
            nombre,
            hectareas: parseFloat(hectareas),
            latitud: parseFloat(lat),
            longitud: parseFloat(lng),
            idProvincia: parseInt(idProvincia),
            idCanton: parseInt(idCanton),
            idDistrito: parseInt(idDistrito),
            servicios
        };

        ShowConfirm('Enviar solicitud', '¿Está seguro de enviar la solicitud? Una vez enviada, pasará a revisión.', () => {
            $.ajax({
                url: API_URL_BASE + '/api/Solicitudes/Create',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(payload),
                success: (res) => {
                    if (res.result === 'ok') {
                        ShowSuccess('Solicitud enviada', 'Su finca fue registrada y está pendiente de revisión.');
                        setTimeout(() => { window.location = '/Fincas'; }, 2000);
                    } else {
                        ShowError('Error', res.message || 'No se pudo registrar la finca.');
                    }
                },
                error: () => ShowError('Error', 'No se pudo conectar con el servidor.')
            });
        });
    };
}

$(document).ready(() => {
    let v = new CrearFinca();
    v.InitView();
});